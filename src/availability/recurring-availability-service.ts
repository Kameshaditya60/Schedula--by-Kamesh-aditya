import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RecurringAvailability } from './entity/recurring-availability.entity';
import { CreateRecurringAvailabilityDto } from './dto/recurring-availability.dto';
import { AvailabilityOverride } from './entity/availability-override.entity';
import { DayOfWeek } from './enums/day-of-week.enum';
import { CreateOverrideDto } from './dto/availability-override.dto';
import { SlotService } from '../slots/slot.service';
import { Booking } from 'src/booking/booking.entity';

@Injectable()
export class RecurringAvailabilityService {
    constructor(
        private slotService: SlotService,
        @InjectRepository(RecurringAvailability)
        private readonly repo: Repository<RecurringAvailability>,

        @InjectRepository(AvailabilityOverride)
        private readonly overrideRepo: Repository<AvailabilityOverride>,

        @InjectRepository(Booking)
        private readonly bookingRepo: Repository<Booking>,

        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateRecurringAvailabilityDto, user_id: string) {
        if (dto.start_time >= dto.end_time) {
            throw new BadRequestException('End time must be later than start time');
        }

        const createdSlots = [];

        for (const day of dto.day_of_week) {


            const conflict = await this.repo.findOne({
                where: {
                    doctor_id: user_id,
                    day_of_week: day,
                    is_active: true,
                },
            });

            if (conflict) {
                const hasOverlap =
                    dto.start_time < conflict.end_time &&
                    dto.end_time > conflict.start_time;

                if (hasOverlap) {
                    throw new BadRequestException(
                        `Overlap detected on ${day}. You already have availability during this time. 
          Time overlap detected on ${day}. Existing slot: ${conflict.start_time} - ${conflict.end_time}`
                    );
                }
            }


            const slot = this.repo.create({
                doctor_id: user_id,
                day_of_week: day,
                start_time: dto.start_time,
                end_time: dto.end_time,
                max_appts_per_slot: dto.max_appts_per_slot,
                session_type: dto.session_type,
                slot_duration: dto.slot_duration,
                schedule_type: dto.schedule_type,
            });

            const saved = await this.repo.save(slot);
            createdSlots.push(saved);
        }

        return createdSlots;
    }
    async getAvailabilityByDate(doctorId: string, date: string) {
        if (!doctorId || !date) {
            throw new BadRequestException('doctorId and date query parameters are required');
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        if (date < todayStr) {
            throw new BadRequestException('Cannot check availability for past dates');
        }

        const overrides = await this.overrideRepo.find({
            where: { doctor_id: doctorId, date },
        });

        if (overrides.length > 0) {

            if (overrides.some(o => o.is_unavailable)) {
                return {
                    message: `Doctor is unavailable on ${date}`,
                    available: false,
                    slots: [],
                };
            }

            return {
                date,
                available: true,
                message: `Doctor is available on ${date}`,
                slots: overrides.map(o => ({
                    start_time: o.start_time,
                    end_time: o.end_time,
                })),
            };
        }

        const day = this.getDayOfWeek(date);

        const todaySlots = await this.repo.find({
            where: {
                doctor_id: doctorId,
                day_of_week: day,
                is_active: true,
            },
            order: { start_time: 'ASC' },
        });
        if (todaySlots.length > 0) {
            const tokenCount = await this.bookingRepo.count({
                where: {
                    doctor_id: doctorId,
                    date: date,
                    status: 'BOOKED',
                },
            });
            return {
                date,
                available: true,
                slots: todaySlots.map(r => ({
                    start_time: r.start_time,
                    end_time: r.end_time,
                })),
                token_no: tokenCount + 1,
                message: todaySlots.length > 0 ? `Doctor is available on ${date}` : `Doctor has no availability on ${date}`,
            };
        }

        const next = await this.slotService.suggestNextAvailableDay(doctorId, date);

        if (!next) {
            return {
                available: false,
                message: 'No upcoming availability found.',
            };

        }

        return {
            message: `No appointments available on ${date}. Next available appointment is on ${next.date} and Token Number will be ${next.token_no}`,
            available: true,
            date: next.date,
            slots: next.slots,
            token_no: next.token_no,
        };  
    }

    async createOverride(dto: CreateOverrideDto, user_id: string
    ) {

        if (!dto.is_unavailable) {
            if (!dto.start_time || !dto.end_time) {
                throw new BadRequestException(
                    'start_time and end_time are required unless is_unavailable = true'
                );
            }

            if (dto.start_time >= dto.end_time) {
                throw new BadRequestException('start_time must be earlier than end_time');
            }
        }

        return this.dataSource.transaction(async (manager) => {
            const overrideRepo = manager.getRepository(AvailabilityOverride);
            const bookingRepo = manager.getRepository(Booking);

            await overrideRepo.delete({ doctor_id: user_id, date: dto.date });

            const saved = await overrideRepo.save(
                overrideRepo.create({
                    doctor_id: user_id,
                    date: dto.date,
                    start_time: dto.start_time || null,
                    end_time: dto.end_time || null,
                    slot_duration: dto.slot_duration || null,
                    session_type: dto.session_type || null,
                    schedule_type: dto.schedule_type || null,
                    max_appts_per_slot: dto.max_appts_per_slot || null,
                    is_unavailable: dto.is_unavailable,
                }),
            );

            let cancelledBookings = 0;
            if (dto.is_unavailable === true) {
                const result = await bookingRepo
                    .createQueryBuilder()
                    .update(Booking)
                    .set({ status: 'CANCELLED' })
                    .where('doctor_id = :doctor_id', { doctor_id: user_id })
                    .andWhere('date = :date', { date: dto.date })
                    .andWhere('status = :status', { status: 'BOOKED' })
                    .execute();
                cancelledBookings = result.affected ?? 0;
            }

            return { override: saved, cancelledBookings };
        });
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


    //   /** DOCTOR CAN VIEW HIS OWN AVAILABILITY */
    //   async getMyAvailability(doctorId: string) {
    //     return this.repo.find({
    //       where: { doctor_id: doctorId, is_active: true },
    //       order: { day_of_week: 'ASC', start_time: 'ASC' },
    //     });
    //   }

    //   /** OPTIONAL - DEACTIVATE */
    //   async deactivateSlot(slotId: string, doctorId: string) {
    //     const slot = await this.repo.findOne({ where: { slot_id: slotId } });

    //     if (!slot) throw new BadRequestException('Slot not found');
    //     if (slot.doctor_id !== doctorId)
    //       throw new ForbiddenException('You can only modify your availability');

    //     slot.is_active = false;
    //     return await this.repo.save(slot);
    //   }
}