
import { BadRequestException, Injectable } from '@nestjs/common';
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
    
  ) { }

  async getSlotsForDate(doctorId: string, date: string) {
    if (!doctorId || !date) {
      throw new BadRequestException('doctor_id and date query parameters are required');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      throw new BadRequestException('Cannot book slots for past dates');
    }
    
    const override = await this.overrideRepo.findOne({
      where: { doctor_id: doctorId, date },
    });

    if (override) {
      if (override.is_unavailable) return []; 

      return this.buildSlotsFromAvailability(
        override.start_time,
        override.end_time,
        doctorId,
        date,
        override.slot_duration,
      );
    }


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
        item.max_appts_per_slot,
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
    maxAppts?: number,
  ) {
   
    let slots = generateTimeSlots(start, end, interval);

   
    const booked = await this.bookingRepo.find({
      where: { doctor_id: doctorId, date },
    });

    const bookingCountMap = new Map<string, number>();

    booked
      .filter((b) => b.status === 'BOOKED')
      .forEach((b) => {
        const key = `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)}`;
        bookingCountMap.set(key, (bookingCountMap.get(key) || 0) + 1);
      });

    slots = slots.filter((slot) => {
      const key = `${slot.start}-${slot.end}`;
      const count = bookingCountMap.get(key) || 0;
      return count < maxAppts;
    });

 
    const today = new Date();
    const isToday =
      today.toISOString().slice(0, 10) === date;

    if (isToday) {
      const currentTime = today.toTimeString().slice(0, 5);

      slots = slots.filter((slot) => slot.start > currentTime);
    }

    return slots;
  }

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