
import { Controller, Get, Query } from "@nestjs/common";
import { SlotService } from "./slot.service";

@Controller('slots')
export class SlotController {
  constructor(private slotService: SlotService) {}

  @Get()
  async getSlots(
    @Query('doctor_id') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.slotService.getSlotsForDate(doctorId, date);
  }
}