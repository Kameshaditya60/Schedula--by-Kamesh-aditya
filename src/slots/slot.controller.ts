
import { Controller, Get, Query } from '@nestjs/common';
import { SlotService } from './slot.service';
import { getUnavailableMessage } from './slot.utils';

@Controller('slots')
export class SlotController {
  constructor(private slotService: SlotService) {}

  @Get()
  async getSlots(
    @Query('doctor_id') doctorId: string,
    @Query('date') date: string,
  ) {
     const result = await this.slotService.getSlotsForDate(doctorId, date);

    if (result.slots.length === 0 && result.reason) {
      const message = getUnavailableMessage(result.reason, date);
      const next = await this.slotService.suggestNextAvailableDay(doctorId, date);
      return {
        available: false,
        message,
        next_available: next ? { date: next.date, slots: next.slots } : null,
      };
    }

    return { available: true, slots: result.slots };
  }
}