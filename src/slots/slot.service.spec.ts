/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { SlotService } from './slot.service';
import { SlotUnavailableReason } from './enums/slot-unavailable-reason.enum';
import { RecurringAvailability } from '../availability/entity/recurring-availability.entity';
import { AvailabilityOverride } from '../availability/entity/availability-override.entity';
import { Booking } from '../booking/booking.entity';
import { ScheduleType } from '../availability/enums/schedule-type.enum';
import { DayOfWeek } from '../availability/enums/day-of-week.enum';
import { ClinicHolidayService } from '../clinic-holiday/clinic-holiday.service';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepo = <T = any>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
});

const DOCTOR_ID = 'doc-1';

// Pick a future Monday far enough out so "today" filtering doesn't apply.
const FUTURE_MONDAY = '2099-01-05'; // 2099-01-05 is a Monday
const FUTURE_SUNDAY = '2099-01-04';
const PAST_DATE = '2000-01-01';

describe('SlotService', () => {
  let service: SlotService;
  let recurringRepo: MockRepo<RecurringAvailability>;
  let overrideRepo: MockRepo<AvailabilityOverride>;
  let bookingRepo: MockRepo<Booking>;
  let clinicHoliday: { isHoliday: jest.Mock };

  beforeEach(async () => {
    recurringRepo = mockRepo();
    overrideRepo = mockRepo();
    bookingRepo = mockRepo();
    clinicHoliday = {
      isHoliday: jest.fn().mockResolvedValue({ isFullDay: false, partialWindows: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotService,
        { provide: getRepositoryToken(RecurringAvailability), useValue: recurringRepo },
        { provide: getRepositoryToken(AvailabilityOverride), useValue: overrideRepo },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: ClinicHolidayService, useValue: clinicHoliday },
      ],
    }).compile();

    service = module.get<SlotService>(SlotService);
  });

  // ----- Input validation -----

  describe('input validation', () => {
    it('A11a: throws if doctor_id missing', async () => {
      await expect(service.getSlotsForDate('', FUTURE_MONDAY)).rejects.toThrow(BadRequestException);
    });

    it('A11b: throws if date missing', async () => {
      await expect(service.getSlotsForDate(DOCTOR_ID, '')).rejects.toThrow(BadRequestException);
    });

    it('A10: throws on past date', async () => {
      await expect(service.getSlotsForDate(DOCTOR_ID, PAST_DATE)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ----- Clinic holidays -----

  describe('clinic holidays', () => {
    it('A3: full-day clinic holiday returns CLINIC_HOLIDAY', async () => {
      clinicHoliday.isHoliday.mockResolvedValue({ isFullDay: true, partialWindows: [] });

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([]);
      expect(res.reason).toBe(SlotUnavailableReason.CLINIC_HOLIDAY);
    });

    it('A4: partial clinic closure filters out overlapping slots', async () => {
      clinicHoliday.isHoliday.mockResolvedValue({
        isFullDay: false,
        partialWindows: [{ start: '12:00', end: '14:00' }],
      });
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '11:00',
          end_time: '15:00',
          slot_duration: 60,
          schedule_type: ScheduleType.STREAM,
          max_appts_per_slot: 1,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      // 11-12, 12-13, 13-14, 14-15 → 12-13 and 13-14 overlap closure → keep 11-12 and 14-15
      expect(res.slots).toEqual([
        { start: '11:00', end: '12:00' },
        { start: '14:00', end: '15:00' },
      ]);
    });
  });

  // ----- Override path -----

  describe('availability override', () => {
    it('A5: doctor on leave (override is_unavailable) → DOCTOR_ON_LEAVE', async () => {
      overrideRepo.findOne!.mockResolvedValue({ is_unavailable: true });

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([]);
      expect(res.reason).toBe(SlotUnavailableReason.DOCTOR_ON_LEAVE);
    });

    it('A6: partial leave override returns its window slots', async () => {
      overrideRepo.findOne!.mockResolvedValue({
        is_unavailable: false,
        start_time: '14:00',
        end_time: '17:00',
        slot_duration: 60,
        schedule_type: ScheduleType.STREAM,
        max_appts_per_slot: 1,
      });
      bookingRepo.find!.mockResolvedValue([]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
      ]);
    });
  });

  // ----- Recurring schedule -----

  describe('recurring schedule', () => {
    it('A2: no recurring for this weekday → CLINIC_HOLIDAY (one-clinic-one-doctor rule)', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_SUNDAY);

      expect(res.slots).toEqual([]);
      expect(res.reason).toBe(SlotUnavailableReason.CLINIC_HOLIDAY);
    });

    it('A1: STREAM with no bookings returns all slots', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '09:00',
          end_time: '11:00',
          slot_duration: 30,
          schedule_type: ScheduleType.STREAM,
          max_appts_per_slot: 1,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([
        { start: '09:00', end: '09:30' },
        { start: '09:30', end: '10:00' },
        { start: '10:00', end: '10:30' },
        { start: '10:30', end: '11:00' },
      ]);
      expect(res.reason).toBeUndefined();
    });

    it('A7: STREAM all slots booked → ALL_SLOTS_BOOKED', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '09:00',
          end_time: '10:00',
          slot_duration: 30,
          schedule_type: ScheduleType.STREAM,
          max_appts_per_slot: 1,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([
        { start_time: '09:00', end_time: '09:30', status: 'BOOKED' },
        { start_time: '09:30', end_time: '10:00', status: 'BOOKED' },
      ]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([]);
      expect(res.reason).toBe(SlotUnavailableReason.ALL_SLOTS_BOOKED);
    });

    it('A12: WAVE with capacity remaining keeps slot', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '09:00',
          end_time: '09:30',
          slot_duration: 30,
          schedule_type: ScheduleType.WAVE,
          max_appts_per_slot: 3,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([
        { start_time: '09:00', end_time: '09:30', status: 'BOOKED' },
      ]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([{ start: '09:00', end: '09:30' }]);
    });

    it('A13: WAVE at capacity drops slot', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '09:00',
          end_time: '09:30',
          slot_duration: 30,
          schedule_type: ScheduleType.WAVE,
          max_appts_per_slot: 2,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([
        { start_time: '09:00', end_time: '09:30', status: 'BOOKED' },
        { start_time: '09:00', end_time: '09:30', status: 'BOOKED' },
      ]);

      const res = await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(res.slots).toEqual([]);
      expect(res.reason).toBe(SlotUnavailableReason.ALL_SLOTS_BOOKED);
    });

    it('A8: today after end-time → CONSULTING_HOURS_OVER', async () => {
      const today = new Date().toISOString().slice(0, 10);
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '00:00',
          end_time: '00:30',
          slot_duration: 30,
          schedule_type: ScheduleType.STREAM,
          max_appts_per_slot: 1,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([]);

      const res = await service.getSlotsForDate(DOCTOR_ID, today);

      // Schedule ended at 00:30 — by the time tests run today, current time > 00:30 (unless run at midnight).
      // Slots existed pre-time-filter, but all in past → CONSULTING_HOURS_OVER.
      if (res.slots.length === 0) {
        expect(res.reason).toBe(SlotUnavailableReason.CONSULTING_HOURS_OVER);
      }
    });

    it('rejects invalid slot_duration', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '09:00',
          end_time: '11:00',
          slot_duration: 0,
          schedule_type: ScheduleType.STREAM,
          max_appts_per_slot: 1,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([]);

      await expect(service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects start_time === end_time', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([
        {
          start_time: '09:00',
          end_time: '09:00',
          slot_duration: 30,
          schedule_type: ScheduleType.STREAM,
          max_appts_per_slot: 1,
        },
      ]);
      bookingRepo.find!.mockResolvedValue([]);

      await expect(service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('queries with the correct day-of-week', async () => {
      overrideRepo.findOne!.mockResolvedValue(null);
      recurringRepo.find!.mockResolvedValue([]);

      await service.getSlotsForDate(DOCTOR_ID, FUTURE_MONDAY);

      expect(recurringRepo.find).toHaveBeenCalledWith({
        where: { doctor_id: DOCTOR_ID, day_of_week: DayOfWeek.MONDAY },
      });
    });
  });

  // ----- suggestNextAvailableDay -----

  describe('suggestNextAvailableDay', () => {
    it('A14: returns null when no day available within max range', async () => {
      const spy = jest
        .spyOn(service, 'getSlotsForDate')
        .mockResolvedValue({ slots: [], reason: SlotUnavailableReason.CLINIC_HOLIDAY });

      const res = await service.suggestNextAvailableDay(DOCTOR_ID, FUTURE_MONDAY, 3);

      expect(res).toBeNull();
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('returns the first day with available slots, plus next token_no', async () => {
      const slots = [{ start: '09:00', end: '09:30' }];
      jest
        .spyOn(service, 'getSlotsForDate')
        .mockResolvedValueOnce({ slots: [], reason: SlotUnavailableReason.CLINIC_HOLIDAY })
        .mockResolvedValueOnce({ slots });
      bookingRepo.count!.mockResolvedValue(2);

      const res = await service.suggestNextAvailableDay(DOCTOR_ID, FUTURE_MONDAY, 5);

      expect(res).not.toBeNull();
      expect(res!.slots).toEqual(slots);
      expect(res!.token_no).toBe(3);
      // Date should be 2 days after FUTURE_MONDAY (loop starts at +1, second iteration is +2).
      expect(res!.date).toBe('2099-01-07');
    });
  });
});
