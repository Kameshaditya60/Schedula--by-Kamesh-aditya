
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { BookingRepository } from '../bookings/booking.repository';
import { AvailabilityOverride } from 'src/availability/entity/availability-override.entity';
import { RecurringAvailability } from 'src/availability/entity/recurring-availability.entity';
import { generateTimeSlots } from './slot.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayOfWeek } from 'src/availability/enums/day-of-week.enum';
import { Booking } from 'src/booking/booking.entity';
@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(RecurringAvailability)

    private readonly recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(AvailabilityOverride)
    private readonly overrideRepo: Repository<AvailabilityOverride>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    // private bookingRepo: BookingRepository, // if booking exists
  ) { }

  async getSlotsForDate(doctorId: string, date: string) {

    // 1️⃣ Check for override first
    const override = await this.overrideRepo.findOne({
      where: { doctor_id: doctorId, date },
    });

    if (override) {
      if (override.is_unavailable) return []; // full day blocked

      return this.buildSlotsFromAvailability(
        override.start_time,
        override.end_time,
        doctorId,
        date,
        override.slot_duration,
      );
    }

    // 2️⃣ Fallback: recurring availability

    const dayName = this.getDayOfWeek(date);

    const recurring = await this.recurringRepo.find({
      where: { doctor_id: doctorId, day_of_week: dayName },
    });

    if (!recurring.length) return [];

    let finalSlots = [];

    for (const item of recurring) {
      const slots = await this.buildSlotsFromAvailability(
        item.start_time,
        item.end_time,
        doctorId,
        date,
        item.slot_duration,
      );

      finalSlots.push(...slots);
    }

    return finalSlots;
  }

  private async buildSlotsFromAvailability(
    start: string,
    end: string,
    doctorId: string,
    date: string,
    interval: number,
  ) {
    // 1️⃣ generate raw slots
    let slots = generateTimeSlots(start, end, interval);

    // 2️⃣ remove slots that are already booked
    const booked = await this.bookingRepo.find({
      where: { doctor_id: doctorId, date },
    });

    console.log('Booked slots for doctor', doctorId, 'on date', date, ':', booked);

    // const bookedKeys = new Set(
    //   booked.map((b) => `${b.start_time}-${b.end_time}`),
    // );
    const bookedKeys = new Set(
    booked
    .filter((b) => b.status === 'BOOKED')
    .map((b) => 
        `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)}`
    )
);
    console.log('Booked keys:', bookedKeys);

    slots = slots.filter(
      (slot) => !bookedKeys.has(`${slot.start}-${slot.end}`),
    );
    console.log('Filtered slots:', slots);


    // 3️⃣ remove past slots if date = today
    const today = new Date();
    const isToday =
      today.toISOString().slice(0, 10) === date;

    if (isToday) {
      const currentTime = today.toTimeString().slice(0, 5);

      slots = slots.filter((slot) => slot.start > currentTime);
    }

    return slots;
  }

  //   private mapDay(i: number) {
  //     const map = [
  //       'SUNDAY',
  //       'MONDAY',
  //       'TUESDAY',
  //       'WEDNESDAY',
  //       'THURSDAY',
  //       'FRIDAY',
  //       'SATURDAY',
  //     ];
  //     return map[i];
  //   }
  private getDayOfWeek(date: string): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    const jsDay = new Date(date).getDay(); // 0–6
    return days[jsDay];
  }
}