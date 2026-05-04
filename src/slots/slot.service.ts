import { BadRequestException, Injectable } from '@nestjs/common';
import { AvailabilityOverride } from 'src/availability/entity/availability-override.entity';
import { RecurringAvailability } from 'src/availability/entity/recurring-availability.entity';
import { generateTimeSlots } from './slot.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayOfWeek } from 'src/availability/enums/day-of-week.enum';
import { Booking } from 'src/booking/booking.entity';
import { ScheduleType } from 'src/availability/enums/schedule-type.enum';
import { ClinicHolidayService } from 'src/clinic-holiday/clinic-holiday.service';
import { SlotUnavailableReason } from './enums/slot-unavailable-reason.enum';

type SlotTime = { start: string; end: string };

export type SlotsResult = {
  slots: SlotTime[];
  reason?: SlotUnavailableReason;
};

@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private readonly recurringRepo: Repository<RecurringAvailability>,

    @InjectRepository(AvailabilityOverride)
    private readonly overrideRepo: Repository<AvailabilityOverride>,

    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    private readonly clinicHolidayService: ClinicHolidayService,
  ) { }

  async getSlotsForDate(doctorId: string, date: string):
    Promise<SlotsResult> {
    if (!doctorId || !date) {
      throw new BadRequestException('doctor_id and date are required');
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      throw new BadRequestException('Cannot book past dates');
    }

    const clinicStatus = await this.clinicHolidayService.isHoliday(date);

    if (clinicStatus.isFullDay) {
      return { slots: [], reason: SlotUnavailableReason.CLINIC_HOLIDAY };
    }
    const clinicClosureWindows = clinicStatus.partialWindows;

    const override = await this.overrideRepo.findOne({
      where: { doctor_id: doctorId, date },
    });

    if (override) {
      if (override.is_unavailable) {
        return { slots: [], reason: SlotUnavailableReason.DOCTOR_ON_LEAVE };
      }

      const bookings = await this.bookingRepo.find({
        where: { doctor_id: doctorId, date },
      });

      const { bookedSet, bookedCountMap } = this.buildBookingMaps(bookings);

      const built = this.buildSlots({
        start: override.start_time,
        end: override.end_time,
        date,
        interval: override.slot_duration,
        scheduleType: override.schedule_type,
        maxAppts: override.max_appts_per_slot,
        bookedSet,
        bookedCountMap,
      });

      const finalSlots = this.filterClinicClosureSlots(built.slots, clinicClosureWindows);

      if (finalSlots.length === 0) {
        return { slots: [], reason: built.reason ?? SlotUnavailableReason.ALL_SLOTS_BOOKED };
      }
      return { slots: finalSlots };
    }

    const dayName = this.getDayOfWeek(date);
    const recurring = await this.recurringRepo.find({
      where: { doctor_id: doctorId, day_of_week: dayName },
    });

    if (!recurring.length) {
      return { slots: [], reason: SlotUnavailableReason.CLINIC_HOLIDAY };
    }

    const bookings = await this.bookingRepo.find({
      where: { doctor_id: doctorId, date },
    });

    const { bookedSet, bookedCountMap } = this.buildBookingMaps(bookings);

    let allSlots: SlotTime[] = [];
    let lastReason: SlotUnavailableReason | undefined;
    for (const item of recurring) {
      if (item.slot_duration <= 0) {
        throw new BadRequestException(`Invalid slot_duration in recurring`);
      }

      if (item.start_time === item.end_time) {
        throw new BadRequestException(
          'Invalid time range: start_time and end_time must be different',
        );
      }
      let built = this.buildSlots({
        start: item.start_time,
        end: item.end_time,
        date,
        interval: item.slot_duration,
        scheduleType: item.schedule_type,
        maxAppts: item.max_appts_per_slot,
        bookedSet,
        bookedCountMap,
      });

      const filtered = this.filterClinicClosureSlots(built.slots, clinicClosureWindows);

      if (filtered.length > 0) {
        allSlots.push(...filtered);
      } else {
        const reason = built.reason ?? SlotUnavailableReason.ALL_SLOTS_BOOKED;
        // CONSULTING_HOURS_OVER takes priority in the reason reported to the user
        if (!lastReason || reason === SlotUnavailableReason.CONSULTING_HOURS_OVER) {
          lastReason = reason;
        }
      }
    }

    if (allSlots.length === 0) {
      return { slots: [], reason: lastReason ?? SlotUnavailableReason.ALL_SLOTS_BOOKED };
    }

    return { slots: allSlots };
  }
  private buildBookingMaps(bookings: Booking[]): {
    bookedSet: Set<string>;
    bookedCountMap: Map<string, number>;
  } {
    const bookedSet = new Set<string>();
    const bookedCountMap = new Map<string, number>();

    bookings
      .filter((b) => b.status === 'BOOKED')
      .forEach((b) => {
        const key = `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)}`;
        bookedSet.add(key);
        bookedCountMap.set(key, (bookedCountMap.get(key) || 0) + 1);
      });

    return { bookedSet, bookedCountMap };
  }



  private buildSlots({
    start,
    end,
    date,
    interval,
    scheduleType,
    maxAppts,
    bookedSet = new Set<string>(),
    bookedCountMap = new Map<string, number>(),
  }: {
    start: string;
    end: string;
    date: string;
    interval: number;
    scheduleType?: ScheduleType;
    maxAppts?: number;
    bookedSet?: Set<string>;
    bookedCountMap?: Map<string, number>;
  }): { slots: SlotTime[]; reason?: SlotUnavailableReason } {
    const rawSlots = generateTimeSlots(start, end, interval);

    let afterBookingFilter: SlotTime[];

    if (scheduleType === ScheduleType.WAVE) {

      afterBookingFilter = rawSlots.filter((slot) => {
        const key = `${slot.start}-${slot.end}`;
        const count = bookedCountMap.get(key) || 0;
        return count < (maxAppts ?? 0);
      });

    } else {
      afterBookingFilter = rawSlots.filter(
        (slot) => !bookedSet.has(`${slot.start}-${slot.end}`),
      );
    }

    const today = new Date();
    const isToday = today.toISOString().slice(0, 10) === date;

    let finalSlots = afterBookingFilter;

    if (isToday) {
      const currentTime = today.toTimeString().slice(0, 5);
      finalSlots = finalSlots.filter((slot) => slot.start > currentTime);
    }

    if (finalSlots.length === 0) {
      if (afterBookingFilter.length === 0) {
        return { slots: [], reason: SlotUnavailableReason.ALL_SLOTS_BOOKED };
      }
      // afterBookingFilter had slots but all are in the past
      return { slots: [], reason: SlotUnavailableReason.CONSULTING_HOURS_OVER };

    }
    return { slots: finalSlots };
  }

  async suggestNextAvailableDay(
    doctorId: string,
    startDate: string,
    maxDays = 30,
  ): Promise<{ date: string; slots: SlotTime[]; token_no: number } | null> {
    const baseDate = new Date(startDate);

    for (let i = 1; i <= maxDays; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + i);
      const nextDateStr = nextDate.toISOString().slice(0, 10);

      const result = await this.getSlotsForDate(doctorId, nextDateStr);
      if (result.slots.length > 0) {
        const tokenCount = await this.bookingRepo.count({
          where: {
            doctor_id: doctorId,
            date: nextDateStr,
            status: 'BOOKED',
          },
        });

        return {
          date: nextDateStr,
          slots: result.slots,
          token_no: tokenCount + 1,
        };
      }
    }

    return null;
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

    return days[new Date(date).getDay()];
  }

  private filterClinicClosureSlots(
    slots: SlotTime[],
    closureWindows: { start: string; end: string }[],
  ): SlotTime[] {
    if (!closureWindows || closureWindows.length === 0) return slots;

    return slots.filter(
      (slot) =>
        !closureWindows.some(
          (window) => slot.start < window.end && slot.end > window.start,
        ),
    );
  }


}
