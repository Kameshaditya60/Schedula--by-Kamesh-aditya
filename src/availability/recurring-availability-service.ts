import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability } from './entity/recurring-availability.entity';
import { CreateRecurringAvailabilityDto } from './dto/recurring-availability.dto';
import { AvailabilityOverride } from './entity/availability-override.entity';
import { DayOfWeek } from './enums/day-of-week.enum';
import { CreateOverrideDto } from './dto/availability-override.dto';

@Injectable()
export class RecurringAvailabilityService {
    constructor(
        @InjectRepository(RecurringAvailability)
        private readonly repo: Repository<RecurringAvailability>,

        @InjectRepository(AvailabilityOverride)
        private readonly overrideRepo: Repository<AvailabilityOverride>,
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

        const today = new Date().toISOString().slice(0, 10);
        if (date < today) {
            throw new BadRequestException('Cannot check availability for past dates');
        }

        const overrides = await this.overrideRepo.find({
            where: { doctor_id: doctorId, date },
        });

        console.log('Overrides found:', overrides);
        if (overrides.length > 0) {

            if (overrides.some(o => o.is_unavailable)) {
                return {
                    date,
                    available: false,
                    slots: [],
                };
            }

            return {
                date,
                available: true,
                slots: overrides.map(o => ({
                    start_time: o.start_time,
                    end_time: o.end_time,
                })),
            };
        }

        const day = this.getDayOfWeek(date);

        const recurring = await this.repo.find({
            where: {
                doctor_id: doctorId,
                day_of_week: day,
                is_active: true,
            },
            order: { start_time: 'ASC' },
        });

        console.log('No override for this date. Returning recurring availability.' + recurring.forEach(r => console.log(`Recurring slot: ${r.start_time} - ${r.end_time}`)) + ` for doctor ${doctorId} on date ${date}`);

        return {
            date,
            available: recurring.length > 0,
            slots: recurring.map(r => ({
                start_time: r.start_time,
                end_time: r.end_time,
            })),
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
        const existing = await this.overrideRepo.find({
            where: { doctor_id: user_id, date: dto.date },
        });

        // If overrides already exist for this date, update them by deleting and recreating
        if (existing && existing.length > 0) {
            await this.overrideRepo.delete({
                doctor_id: user_id,
                date: dto.date,
            });
        }

        const override = this.overrideRepo.create({
            doctor_id: user_id,
            date: dto.date,
            start_time: dto.start_time || null,
            end_time: dto.end_time || null,
            slot_duration: dto.slot_duration || null,
            session_type: dto.session_type || null,
            schedule_type: dto.schedule_type || null,
            max_appts_per_slot: dto.max_appts_per_slot || null,
            is_unavailable: dto.is_unavailable,
        });

        return this.overrideRepo.save(override);
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