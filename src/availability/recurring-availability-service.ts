import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability } from './recurring-availability.entity';
import { CreateRecurringAvailabilityDto } from './dto/recurring-availability.dto';
import { AvailabilityOverride } from './availability-override.entity';
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
                max_appointments: dto.max_appointments,
                session_type: dto.session_type,
            });

            const saved = await this.repo.save(slot);
            createdSlots.push(saved);
        }

        return createdSlots;
    }
    async getAvailabilityByDate(doctorId: string, date: string) {

        const overrides = await this.overrideRepo.find({
            where: { doctor_id: doctorId, date },
        });

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


        if (dto.is_unavailable) {
            const conflict = existing.some(e => e.is_unavailable === true);
            if (conflict) {
                throw new BadRequestException(
                    'Full-day unavailability already exists for this date'
                );
            }
        }
        if (!dto.is_unavailable) {
            for (const e of existing) {
                if (e.is_unavailable) {

                    throw new BadRequestException(
                        `Cannot create time override because full-day unavailability exists`
                    );
                }

                if (!e.start_time || !e.end_time) continue;

                const newStart = dto.start_time;
                const newEnd = dto.end_time;
                const existingStart = e.start_time;
                const existingEnd = e.end_time;

                // Overlap logic
                const overlaps =
                    newStart < existingEnd && existingStart < newEnd;

                if (overlaps) {
                    throw new BadRequestException(
                        `Time range overlaps with an existing override (${existingStart} - ${existingEnd})`
                    );
                }
            }
        }
        const override = this.overrideRepo.create({
            doctor_id: user_id,
            date: dto.date,
            start_time: dto.start_time || null,
            end_time: dto.end_time || null,
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