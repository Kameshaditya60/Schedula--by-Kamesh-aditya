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

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private repo: Repository<Booking>,

    @InjectRepository(RecurringAvailability)
    private availabilityRepo: Repository<RecurringAvailability>,

    @InjectRepository(AvailabilityOverride)
    private overrideRepo: Repository<AvailabilityOverride>,

    private slotService: SlotService,
  ) { }

  async createBooking(patientId: string, dto: CreateBookingDto) {
    try {
      const { doctor_id, date, start_time, end_time } = dto;

      // 1️⃣ Check if the slot is valid (from getSlotsForDate)
      const slots = await this.slotService.getSlotsForDate(doctor_id, date);

      const isValidSlot = slots.some(
        (s) => s.start === start_time && s.end === end_time,
      );

      if (!isValidSlot && slots.length > 0) {
        console.log("Slot full. Searching next active day...");
        throw new BadRequestException('Selected slot is not available');

      }

      if (slots.length === 0) {
        // STEP 2: find next available day
        const next = await this.slotService.findNextAvailableDay(dto.doctor_id, dto.date);

        if (!next) {
          throw new BadRequestException('No upcoming availability found.');
        }

        const autoSlot = next.slots[0]; // choose first slot

        console.log(`Slot full. Next available slot on ${next.date} at ${autoSlot.start}` + autoSlot );
      

        return {
          message: `No appointments available today. Next available appointment is on ${next.date}`,
          available_slot: autoSlot
        };
      }

      // 2️⃣ Check OVERRIDE first
      const override = await this.overrideRepo.findOne({
        where: { doctor_id, date },
      });

      if (override) {
        if (override.is_unavailable) {
          throw new BadRequestException('Doctor is unavailable on this date');
        }

        // WAVE override → limit based on max_appts_per_slot
        if (override.schedule_type === 'WAVE') {
          const count = await this.repo.count({
            where: { doctor_id, date, start_time },
          });

          if (count >= override.max_appts_per_slot) {
            throw new ConflictException('Slot is fully booked (override)');
          }
        }

        // STREAM override → ensure not already booked
        if (override.schedule_type === 'STREAM') {
          const existing = await this.repo.findOne({
            where: { doctor_id, date, start_time },
          });

          if (existing) {
            throw new ConflictException('This slot is already booked');
          }
        }
      } else {
        // 3️⃣ No override → use RECURRING availability
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

        // WAVE recurring
        if (availability.schedule_type === 'WAVE') {
          const count = await this.repo.count({
            where: { doctor_id, date, start_time },
          });

          if (count >= availability.max_appts_per_slot) {
            throw new ConflictException('Slot is fully booked');
          }
        }

        // STREAM recurring
        if (availability.schedule_type === 'STREAM') {
          const existing = await this.repo.findOne({
            where: { doctor_id, date, start_time },
          });

          if (existing) {
            throw new ConflictException('This slot is already booked');
          }
        }
      }

      // 4️⃣ Create booking
      const booking = this.repo.create({
        ...dto,
        patient_id: patientId,
      });

      const saved = await this.repo.save(booking);
      return { message: 'Booking created successfully', data: saved };

    } catch (err: any) {
      const pgCode = err?.code || err?.driverError?.code;

      if (pgCode === '23505') {
        throw new ConflictException('You have already booked this slot');
      }

      throw err;
    }
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
}