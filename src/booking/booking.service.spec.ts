/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { BookingService } from './booking.service';
import { Booking } from './booking.entity';
import { RecurringAvailability } from '../availability/entity/recurring-availability.entity';
import { AvailabilityOverride } from '../availability/entity/availability-override.entity';
import { ClinicHoliday } from '../clinic-holiday/entity/clinic-holiday.entity';
import { SlotService } from '../slots/slot.service';
import { ScheduleType } from '../availability/enums/schedule-type.enum';
import { SlotUnavailableReason } from '../slots/enums/slot-unavailable-reason.enum';
import { todayStr, addDaysStr } from '../common/utils/date-time.util';

const PATIENT_ID = 'pat-1';
const DOCTOR_ID = 'doc-1';
// Use dates within the 7-day booking window (today..today+6).
const IN_WINDOW_DAY_1 = addDaysStr(todayStr(), 1);
const IN_WINDOW_DAY_2 = addDaysStr(todayStr(), 2);
const FUTURE_MONDAY = IN_WINDOW_DAY_1;
const FUTURE_TUESDAY = IN_WINDOW_DAY_2;

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn((x) => x),
  save: jest.fn(async (x) => ({ id: 'booking-1', status: 'BOOKED', ...x })),
});

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: ReturnType<typeof mockRepo>;
  let availabilityRepo: ReturnType<typeof mockRepo>;
  let overrideRepo: ReturnType<typeof mockRepo>;
  let clinicHolidayRepo: ReturnType<typeof mockRepo>;
  let slotService: { getSlotsForDate: jest.Mock; suggestNextAvailableDay: jest.Mock };

  beforeEach(async () => {
    bookingRepo = mockRepo();
    availabilityRepo = mockRepo();
    overrideRepo = mockRepo();
    clinicHolidayRepo = mockRepo();
    slotService = {
      getSlotsForDate: jest.fn(),
      suggestNextAvailableDay: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(RecurringAvailability), useValue: availabilityRepo },
        { provide: getRepositoryToken(AvailabilityOverride), useValue: overrideRepo },
        { provide: getRepositoryToken(ClinicHoliday), useValue: clinicHolidayRepo },
        { provide: SlotService, useValue: slotService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  // Helpers
  const streamRecurring = (start = '09:00', end = '17:00') => ({
    start_time: start,
    end_time: end,
    schedule_type: ScheduleType.STREAM,
    max_appts_per_slot: 1,
  });

  const waveRecurring = (max = 3) => ({
    start_time: '09:00',
    end_time: '17:00',
    schedule_type: ScheduleType.WAVE,
    max_appts_per_slot: max,
  });

  // ----- STREAM happy path -----

  describe('STREAM bookings', () => {
    it('B1: creates booking with token=1 on first booking of day', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [{ start: '09:00', end: '09:30' }],
      });
      overrideRepo.findOne.mockResolvedValue(null);
      availabilityRepo.findOne.mockResolvedValue(streamRecurring());
      bookingRepo.count.mockResolvedValue(0);

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: FUTURE_MONDAY,
      } as any);

      expect(res.message).toBe('Booking created successfully');
      expect(res.token_no).toBe(1);
      expect(res.alloted_slot).toEqual({ start: '09:00', end: '09:30' });
      expect(bookingRepo.save).toHaveBeenCalled();
    });

    it('B2: token increments on subsequent bookings', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [{ start: '09:00', end: '09:30' }],
      });
      overrideRepo.findOne.mockResolvedValue(null);
      availabilityRepo.findOne.mockResolvedValue(streamRecurring());
      bookingRepo.count.mockResolvedValue(2);

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: FUTURE_MONDAY,
      } as any);

      expect(res.token_no).toBe(3);
    });

    it('B7: duplicate booking rejected with ConflictException', async () => {
      bookingRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: FUTURE_MONDAY,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ----- "Next available" suggestion path -----

  describe('next-available suggestion when no slots', () => {
    const noSlotsCases: { name: string; reason: SlotUnavailableReason; expectedFragment: string }[] = [
      { name: 'B3: all slots booked', reason: SlotUnavailableReason.ALL_SLOTS_BOOKED, expectedFragment: 'fully booked' },
      { name: 'B4: clinic closed', reason: SlotUnavailableReason.CLINIC_HOLIDAY, expectedFragment: 'Clinic is closed' },
      { name: 'B5: doctor on leave', reason: SlotUnavailableReason.DOCTOR_ON_LEAVE, expectedFragment: 'Doctor is unavailable' },
      { name: 'B6: after hours', reason: SlotUnavailableReason.CONSULTING_HOURS_OVER, expectedFragment: 'Consultation hours are over' },
    ];

    it.each(noSlotsCases)('$name → $expectedFragment + next slot', async ({ reason, expectedFragment }) => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({ slots: [], reason });
      slotService.suggestNextAvailableDay.mockResolvedValue({
        date: FUTURE_TUESDAY,
        slots: [{ start: '09:00', end: '09:30' }],
        token_no: 1,
      });

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: FUTURE_MONDAY,
      } as any);

      expect(res.message).toContain(expectedFragment);
      expect(res.message).toContain(FUTURE_TUESDAY);
      expect(res.available_slot).toEqual({ start: '09:00', end: '09:30' });
      expect(res.token_no).toBe(1);
      expect(res.ReportingTime).toBe('08:45'); // B14
    });

    it('B12: throws when no upcoming availability found within 30 days', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [],
        reason: SlotUnavailableReason.CLINIC_HOLIDAY,
      });
      slotService.suggestNextAvailableDay.mockResolvedValue(null);

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: FUTURE_MONDAY,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('B15: ReportingTime wraps across midnight when first slot is 00:10', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [],
        reason: SlotUnavailableReason.ALL_SLOTS_BOOKED,
      });
      slotService.suggestNextAvailableDay.mockResolvedValue({
        date: FUTURE_TUESDAY,
        slots: [{ start: '00:10', end: '00:40' }],
        token_no: 1,
      });

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: FUTURE_MONDAY,
      } as any);

      expect(res.ReportingTime).toBe('23:55');
    });
  });

  // ----- WAVE -----

  describe('WAVE bookings', () => {
    beforeEach(() => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [{ start: '09:00', end: '09:30' }],
      });
      overrideRepo.findOne.mockResolvedValue(null);
      availabilityRepo.findOne.mockResolvedValue(waveRecurring(3));
    });

    it('B8: rejects WAVE booking missing start/end times', async () => {
      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: FUTURE_MONDAY,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('B9: creates WAVE booking when slot has capacity', async () => {
      bookingRepo.count.mockResolvedValue(1); // 1 of 3 booked

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: FUTURE_MONDAY,
        start_time: '09:00',
        end_time: '09:30',
      } as any);

      expect(res.message).toBe('Booking created successfully');
      expect(bookingRepo.save).toHaveBeenCalled();
    });

    it('B10: rejects when WAVE slot is at capacity', async () => {
      bookingRepo.count.mockResolvedValue(3);

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: FUTURE_MONDAY,
          start_time: '09:00',
          end_time: '09:30',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('B11: rejects when start/end do not match any available slot', async () => {
      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: FUTURE_MONDAY,
          start_time: '13:00',
          end_time: '13:30',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ----- Postgres unique constraint translation (B13 race) -----

  describe('concurrency / DB unique constraint', () => {
    it('B13: translates pg error 23505 to ConflictException', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [{ start: '09:00', end: '09:30' }],
      });
      overrideRepo.findOne.mockResolvedValue(null);
      availabilityRepo.findOne.mockResolvedValue(streamRecurring());
      bookingRepo.count.mockResolvedValue(0);
      bookingRepo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: FUTURE_MONDAY,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ----- cancelBooking -----

  describe('cancelBooking', () => {
    it('C1: cancels own booking', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        patient_id: PATIENT_ID,
        status: 'BOOKED',
        date: addDaysStr(todayStr(), 2),
        start_time: '09:00',
      });
      bookingRepo.save.mockImplementation(async (b) => b);

      const res = await service.cancelBooking('b1', PATIENT_ID);

      expect(res.status).toBe('CANCELLED');
    });

    it('C2: rejects cancelling another patient\'s booking', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        patient_id: 'other-patient',
        status: 'BOOKED',
        date: addDaysStr(todayStr(), 2),
        start_time: '09:00',
      });

      await expect(service.cancelBooking('b1', PATIENT_ID)).rejects.toThrow(ForbiddenException);
    });

    it('C3: rejects when booking not found', async () => {
      bookingRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelBooking('missing', PATIENT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('C4: rejects cancelling an already-CANCELLED booking', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        patient_id: PATIENT_ID,
        status: 'CANCELLED',
        date: addDaysStr(todayStr(), 2),
        start_time: '09:00',
      });

      await expect(service.cancelBooking('b1', PATIENT_ID)).rejects.toThrow(
        /already cancelled/i,
      );
    });

    it('C5: rejects cancelling a past appointment', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        patient_id: PATIENT_ID,
        status: 'BOOKED',
        date: addDaysStr(todayStr(), -1),
        start_time: '09:00',
      });

      await expect(service.cancelBooking('b1', PATIENT_ID)).rejects.toThrow(
        /past appointment/i,
      );
    });

    it('C6: rejects cancelling within 1 hour of appointment start', async () => {
      // appointment starts ~30 minutes from now
      const start = new Date(Date.now() + 30 * 60 * 1000);
      const date = start.toISOString().slice(0, 10);
      const start_time = start.toISOString().slice(11, 16); // HH:mm UTC

      bookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        patient_id: PATIENT_ID,
        status: 'BOOKED',
        date,
        start_time,
      });

      await expect(service.cancelBooking('b1', PATIENT_ID)).rejects.toThrow(
        /at least 1 hour/i,
      );
    });
  });

  // ----- 7-day booking window -----

  describe('7-day booking window', () => {
    const setupHappyPathMocks = () => {
      bookingRepo.findOne.mockResolvedValue(null);
      slotService.getSlotsForDate.mockResolvedValue({
        slots: [{ start: '09:00', end: '09:30' }],
      });
      overrideRepo.findOne.mockResolvedValue(null);
      availabilityRepo.findOne.mockResolvedValue(streamRecurring());
      bookingRepo.count.mockResolvedValue(0);
    };

    it('W1: rejects booking earlier than today', async () => {
      const yesterday = addDaysStr(todayStr(), -1);

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: yesterday,
        } as any),
      ).rejects.toThrow(/within the next 7 days/i);
    });

    it('W2: rejects booking beyond today+6 (8th day out)', async () => {
      const day8 = addDaysStr(todayStr(), 7);

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: day8,
        } as any),
      ).rejects.toThrow(/within the next 7 days/i);
    });

    it('W3: accepts booking exactly at today (lower bound)', async () => {
      setupHappyPathMocks();

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: todayStr(),
      } as any);

      expect(res.message).toBe('Booking created successfully');
    });

    it('W4: accepts booking exactly at today+6 (upper bound)', async () => {
      setupHappyPathMocks();

      const res = await service.createBooking(PATIENT_ID, {
        doctor_id: DOCTOR_ID,
        date: addDaysStr(todayStr(), 6),
      } as any);

      expect(res.message).toBe('Booking created successfully');
    });

    it('W5: error message includes the maxDate (today+6)', async () => {
      const day8 = addDaysStr(todayStr(), 7);
      const expectedMax = addDaysStr(todayStr(), 6);

      await expect(
        service.createBooking(PATIENT_ID, {
          doctor_id: DOCTOR_ID,
          date: day8,
        } as any),
      ).rejects.toThrow(new RegExp(`today through ${expectedMax}`));
    });
  });
});
