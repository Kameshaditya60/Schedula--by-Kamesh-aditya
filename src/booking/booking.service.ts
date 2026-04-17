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

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private repo: Repository<Booking>,

    @InjectRepository(RecurringAvailability)
    private availabilityRepo: Repository<RecurringAvailability>,

    private slotService: SlotService,
  ) { }
// book a slot
  async createBooking(patientId: string, dto: CreateBookingDto) {

    try {
      const slots = await this.slotService.getSlotsForDate(
        dto.doctor_id,
        dto.date,
      );

      const isValidSlot = slots.some(
        (s) => s.start === dto.start_time && s.end === dto.end_time,
      );
      if (!isValidSlot) {
        throw new BadRequestException('Slot is not available, try another slot time');
      }

  
      const dayOfWeek = new Date(dto.date)
        .toLocaleString('en-US', { weekday: 'long' })
        .toUpperCase();


      const availability = await this.availabilityRepo.findOne({ 
        where: {
          doctor_id: dto.doctor_id,
          day_of_week: DayOfWeek[dayOfWeek],
          start_time: LessThanOrEqual(dto.start_time),
          end_time: MoreThanOrEqual(dto.end_time),
        },
      });

      if (!availability) {
        throw new BadRequestException('No availability found for this slot');
      }


      
      const bookingCount = await this.repo.count({
        where: {
          doctor_id: dto.doctor_id,
          date: dto.date,
          start_time: dto.start_time,
        },
      });


      
      if (bookingCount >= availability.max_appts_per_slot) {
        throw new ConflictException('Slot is fully booked');
      }

      
      const booking = this.repo.create({
        ...dto,
        patient_id: patientId,
      });

      const result = await this.repo.save(booking);
      return { message: 'Booking created successfully', data: result };
    } catch (err: any) {
      if (err?.code === '23505') {
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
      order: { start_time: 'ASC' },
    });
  }
}