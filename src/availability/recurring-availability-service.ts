import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability } from './recurring-availability.entity';
import { CreateRecurringAvailabilityDto } from './dto/recurring-availability.dto';

@Injectable()
export class RecurringAvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private readonly repo: Repository<RecurringAvailability>,
  ) {}

 async create(dto: CreateRecurringAvailabilityDto, user_id: string) {
  if (dto.start_time >= dto.end_time) {
    throw new BadRequestException('End time must be later than start time');
  }

  const createdSlots = [];

  for (const day of dto.day_of_week) {

    // Check overlapping slot for each day
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

    // Create new slot for each day
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