import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/booking.dto';
import { SlotService } from '../slots/slot.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private repo: Repository<Booking>,

    private slotService: SlotService,
  ) {}


  // ✅ BOOK SLOT
  async createBooking(patientId: string, dto: CreateBookingDto) {
    // 1️⃣ Check if slot is valid (exists in generated slots)
    const slots = await this.slotService.getSlotsForDate(
      dto.doctor_id,
      dto.date,
    );

    const isValidSlot = slots.some(
      (s) => s.start === dto.start_time && s.end === dto.end_time,
    );

    if (!isValidSlot) {
      throw new BadRequestException('Invalid or unavailable slot');
    }

    // 2️⃣ Prevent double booking
    const existing = await this.repo.findOne({
      where: {
        doctor_id: dto.doctor_id,
        date: dto.date,
        start_time: dto.start_time,
      },
    });

    if (existing) {
      throw new ConflictException('Slot already booked');
    }

    // 3️⃣ Create booking
    const booking = this.repo.create({
      ...dto,
      patient_id: patientId,
    });

    const result = await this.repo.save(booking);
    return { message: 'Booking created successfully', data: result };
  }

  // ❌ CANCEL BOOKING
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

  // 📋 PATIENT BOOKINGS
  async getPatientBookings(patientId: string) {
    return this.repo.find({
      where: { patient_id: patientId },
      order: { date: 'DESC' },
    });
  }

  // 👨‍⚕️ DOCTOR SCHEDULE
  async getDoctorSchedule(doctorId: string, date: string) {
    return this.repo.find({
      where: { doctor_id: doctorId, date },
      order: { start_time: 'ASC' },
    });
  }
}