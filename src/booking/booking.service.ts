import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/booking.dto';
import { SlotService } from '../slots/slot.service';
import { RecurringAvailability } from '../availability/entity/recurring-availability.entity';
import { DayOfWeek } from 'src/availability/enums/day-of-week.enum';

import { AvailabilityOverride } from 'src/availability/entity/availability-override.entity';
import { ScheduleType } from 'src/availability/enums/schedule-type.enum';
import { SlotUnavailableReason } from 'src/slots/enums/slot-unavailable-reason.enum';
import { ClinicHoliday } from 'src/clinic-holiday/entity/clinic-holiday.entity';
import {
  todayStr,
  addDaysStr,
  combineDateTime,
  minutesUntil,
} from '../common/utils/date-time.util';

@Injectable()
export class BookingService {
  
  constructor(
    @InjectRepository(Booking)
    private repo: Repository<Booking>,

    @InjectRepository(RecurringAvailability)
    private availabilityRepo: Repository<RecurringAvailability>,

    @InjectRepository(AvailabilityOverride)
    private overrideRepo: Repository<AvailabilityOverride>,

    @InjectRepository(ClinicHoliday)
    private clinicHolidayRepo: Repository<ClinicHoliday>,

    private slotService: SlotService,
  ) { }


  async createBooking(patientId: string, dto: CreateBookingDto) {
    try {
      const { doctor_id, date } = dto;

      const today = todayStr();
      const maxDate = addDaysStr(today, 6);
      if (date < today || date > maxDate) {
        throw new BadRequestException(
          `Appointments can only be booked within the next 7 days (today through ${maxDate}).`,
        );
      }

      // 1. Check duplicate booking for same patient + doctor + date
      const existingBooking = await this.repo.findOne({
        where: {
          doctor_id,
          patient_id: patientId,
          date,
          status: 'BOOKED',
        },
      });

      if (existingBooking) {
        throw new ConflictException(
          'You already have a booking with this doctor on this date'
        );
      }

      // 2. Get available slots for that date
      const slotsResult = await this.slotService.getSlotsForDate(doctor_id, date);

      if (slotsResult.slots.length === 0) {
        const next = await this.slotService.suggestNextAvailableDay(doctor_id, date);

        if (!next) {
          throw new BadRequestException('No upcoming availability found within the next 30 days.');
        }
        const message = this.buildUnavailableMessage(slotsResult.reason, date, next.date, next.token_no);
        const ReportingTime = this.subtractMinutes(next.slots[0].start, 15);

        return {
          message,
          available_slot: next.slots[0],
          token_no: next.token_no,
          ReportingTime,
        };
      }

      const slots = slotsResult.slots;
      // 4. Get schedule type
      const firstSlot = slots[0];
      const { scheduleType, maxAppts } = await this.getScheduleType(
        doctor_id,
        date,
        firstSlot.start,
        firstSlot.end,
      );

      // 5. STREAM → auto assign first available slot + token
      if (scheduleType === ScheduleType.STREAM) {

        const assignedSlot = firstSlot;

        // token_no = total BOOKED bookings for this doctor on this date + 1
        const tokenCount = await this.repo.count({
          where: {
            doctor_id,
            date,
            status: 'BOOKED',
          },
        });

        const token_no = tokenCount + 1;

        const booking = this.repo.create({
          doctor_id,
          patient_id: patientId,
          date,
          start_time: assignedSlot.start,
          end_time: assignedSlot.end,
          token_no,
        });

        const saved = await this.repo.save(booking);

        return {
          message: 'Booking created successfully',
          token_no: saved.token_no,
          alloted_slot: {
            start: saved.start_time,
            end: saved.end_time,
          },
          data: saved,
        };
      }

      // 6. WAVE → user must provide start_time and end_time
      if (scheduleType === ScheduleType.WAVE) {

        if (!dto.start_time || !dto.end_time) {
          throw new BadRequestException(
            'start_time and end_time are required for WAVE schedule type'
          );
        }

        const isValidSlot = slots.some(
          (s) => s.start === dto.start_time && s.end === dto.end_time,
        );

        if (!isValidSlot) {
          throw new BadRequestException('Selected slot is not available');
        }

        const count = await this.repo.count({
          where: {
            doctor_id,
            date,
            start_time: dto.start_time,
            status: 'BOOKED',
          },
        });

        if (count >= maxAppts) {
          throw new ConflictException('Slot is fully booked');
        }

        const booking = this.repo.create({
          doctor_id,
          patient_id: patientId,
          date,
          start_time: dto.start_time,
          end_time: dto.end_time,
        });

        const saved = await this.repo.save(booking);

        return {
          message: 'Booking created successfully',
          data: saved,
        };
      }

    } catch (err: any) {
      const pgCode = err?.code || err?.driverError?.code;

      if (pgCode === '23505') {
        throw new ConflictException('You have already booked this slot');
      }

      throw err;
    }
  }

  private async getScheduleType(
    doctor_id: string,
    date: string,
    start_time: string,
    end_time: string,
  ): Promise<{ scheduleType: ScheduleType; maxAppts?: number }> {

    const override = await this.overrideRepo.findOne({
      where: { doctor_id, date },
    });

    if (override && !override.is_unavailable) {
      return {
        scheduleType: override.schedule_type,
        maxAppts: override.max_appts_per_slot,
      };
    }

    const dayName = new Date(date)
      .toLocaleString('en-US', { weekday: 'long' })
      .toUpperCase();

    const availability = await this.availabilityRepo.findOne({
      where: {
        doctor_id,
        day_of_week: DayOfWeek[dayName],
        start_time: LessThanOrEqual(start_time),
        end_time: MoreThanOrEqual(end_time),
      },
    });

    if (!availability) {
      throw new BadRequestException('No availability found for this slot');
    }

    return {
      scheduleType: availability.schedule_type,
      maxAppts: availability.max_appts_per_slot,
    };
  }

  // Cancel booking


  async cancelBooking(bookingId: string, patientId: string) {
    const booking = await this.repo.findOne({
      where: { id: bookingId },
    });

    if (!booking) throw new BadRequestException('Booking not found');

    if (booking.patient_id !== patientId) {
      throw new ForbiddenException('Not your booking');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    const apptStart = combineDateTime(booking.date, booking.start_time);
    if (apptStart.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot cancel a past appointment');
    }
    if (minutesUntil(apptStart) < 60) {
      throw new BadRequestException(
        'Cancellations must be made at least 1 hour before the appointment',
      );
    }

    booking.status = 'CANCELLED';
    return this.repo.save(booking);
  }


  async getPatientBookings(patientId: string) {
    return this.repo.find({
      where: { patient_id: patientId },
      order: { date: 'DESC' },
    });
  }

  async getDoctorSchedule(doctorId: string, date: string) {
    return this.repo.find({
      where: { doctor_id: doctorId, date },
      order: { date: 'ASC', start_time: 'ASC' },
    });
  }

  private buildUnavailableMessage(
    reason: SlotUnavailableReason | undefined,
    requestedDate: string,
    nextDate: string,
    tokenNo: number,
  ): string {
    const suffix = `Next available slot is on ${nextDate}. Token number will be ${tokenNo}.`;
    switch (reason) {
      case SlotUnavailableReason.ALL_SLOTS_BOOKED:
        return `Today's appointments are fully booked. ${suffix}`;
      case SlotUnavailableReason.CONSULTING_HOURS_OVER:
        return `Consultation hours are over. ${suffix}`;
      case SlotUnavailableReason.DOCTOR_ON_LEAVE:
        return `Doctor is unavailable on selected date. ${suffix}`;
      case SlotUnavailableReason.CLINIC_HOLIDAY:
        return `Clinic is closed on selected date. ${suffix}`;
      case SlotUnavailableReason.NO_SCHEDULE:
        return `Doctor has no schedule on ${requestedDate}. ${suffix}`;
      default:
        return `No appointments available on ${requestedDate}. ${suffix}`;
    }
  }


  private subtractMinutes(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    let totalMins = hours * 60 + mins - minutes;

    // Handle negative case (wrap to previous day)
    if (totalMins < 0) {
      totalMins += 24 * 60;
    }

    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }
}