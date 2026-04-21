
import { BadRequestException, Injectable } from '@nestjs/common';
import { AvailabilityOverride } from 'src/availability/entity/availability-override.entity';
import { RecurringAvailability } from 'src/availability/entity/recurring-availability.entity';
import { generateTimeSlots } from './slot.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayOfWeek } from 'src/availability/enums/day-of-week.enum';
import { Booking } from 'src/booking/booking.entity';
import { ScheduleType } from 'src/availability/enums/schedule-type.enum';
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
      throw new BadRequestException('doctor_id and date are required');
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      throw new BadRequestException('Cannot book past dates');
    }

    // 1️⃣ Override check
    const override = await this.overrideRepo.findOne({
      where: { doctor_id: doctorId, date },
    });

    if (override) {
      if (override.is_unavailable) return [];

      console.log('Override found for', doctorId, 'on', date, ':', override);

 // 3️⃣ Fetch bookings ONCE
    const bookings = await this.bookingRepo.find({
      where: { doctor_id: doctorId, date },
    });

    const bookedCountMap = new Map<string, number>();
    const bookedSet = new Set<string>();

    bookings
      .filter((b) => b.status === 'BOOKED')
      .forEach((b) => {
        const key = `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)}`;
        bookedSet.add(key);
        bookedCountMap.set(key, (bookedCountMap.get(key) || 0) + 1);
      });


      return await this.buildSlots({
        start: override.start_time,
        end: override.end_time,
        doctorId,
        date,
        interval: override.slot_duration,
        scheduleType: override.schedule_type, // override usually behaves like stream
        maxAppts: override.max_appts_per_slot,
        bookedSet,
        bookedCountMap,
      });
    }

    // 2️⃣ Get recurring availability
    const dayName = this.getDayOfWeek(date);

    const recurring = await this.recurringRepo.find({
      where: { doctor_id: doctorId, day_of_week: dayName },
    });

    if (!recurring.length) return [];

    // 3️⃣ Fetch bookings ONCE
    const bookings = await this.bookingRepo.find({
      where: { doctor_id: doctorId, date },
    });

    const bookedCountMap = new Map<string, number>();
    const bookedSet = new Set<string>();

    bookings
      .filter((b) => b.status === 'BOOKED')
      .forEach((b) => {
        const key = `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)}`;
        bookedSet.add(key);
        bookedCountMap.set(key, (bookedCountMap.get(key) || 0) + 1);
      });

    // 4️⃣ Generate slots
    let allSlots = [];

    for (const item of recurring) {
      if (override.slot_duration <= 0) {
        throw new BadRequestException("Invalid slot_duration in override");
      }

      if (override.start_time === override.end_time) {
        throw new BadRequestException("Invalid override time range");
      }
      const slots = await this.buildSlots({
        start: item.start_time,
        end: item.end_time,
        doctorId,
        date,
        interval: item.slot_duration,
        scheduleType: item.schedule_type,
        maxAppts: item.max_appts_per_slot,
        bookedSet,
        bookedCountMap,
      });

      allSlots.push(...slots);
    }

    return allSlots;
  }
  private async buildSlots({
    start,
    end,
    doctorId,
    date,
    interval,
    scheduleType,
    maxAppts,
    bookedSet = new Set<string>(),
    bookedCountMap = new Map<string, number>(),
  }: {
    start: string;
    end: string;
    doctorId: string;
    date: string;
    interval: number;
    scheduleType?: ScheduleType;
    maxAppts?: number;
    bookedSet?: Set<string>;
    bookedCountMap?: Map<string, number>;
  }) {




    let slots = generateTimeSlots(start, end, interval);

    console.log('Generated slots before filtering:', slots);
    console.log(' scheduleType:', scheduleType, 'maxAppts:', maxAppts, 'bookedSet:', bookedSet, 'bookedCountMap:', bookedCountMap);
    // 🔥 WAVE logic
    if (scheduleType === ScheduleType.WAVE) {
      console.log('Applying WAVE logic with maxAppts:', maxAppts);
      slots = slots.filter((slot) => {
        const key = `${slot.start}-${slot.end}`;
        const count = bookedCountMap.get(key) || 0;
        return count < (maxAppts ?? 0);
      });

    }

    // 🔥 STREAM logic
    else {

      console.log('Applying STREAM logic, filtering out booked slots');
      slots = slots.filter(
        (slot) => !bookedSet.has(`${slot.start}-${slot.end}`),
      );
      console.log('Slots after STREAM filtering:', slots);
    }

    // ⏱ Remove past slots (only once)
    const today = new Date();
    const isToday = today.toISOString().slice(0, 10) === date;

    console.log('Is the requested date today?', isToday);

    if (isToday) {
      const currentTime = today.toTimeString().slice(0, 5);
      slots = slots.filter((slot) => slot.start > currentTime);
      console.log('Slots after filtering past times:', slots);
    }

    console.log('Final slots to return:', slots);
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