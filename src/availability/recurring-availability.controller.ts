import { Controller, Post, Body, Get, UseGuards, Param, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RecurringAvailabilityService } from './recurring-availability-service';
import { CreateRecurringAvailabilityDto } from './dto/recurring-availability.dto';

@Controller('doctor/availability/recurring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class RecurringAvailabilityController {
  constructor(private readonly service: RecurringAvailabilityService) { }

  @Post()
  async createRecurringAvailability(
    @Request() req, @Body() dto: CreateRecurringAvailabilityDto,

  ) {
    return this.service.create(dto, req.user.user_id);
  }

  // @Get()
  // async getMyAvailability(@GetUser('doctor_id') doctorId: string) {
  //   return this.service.getMyAvailability(doctorId);
  // }

  // @Post('deactivate/:slotId')
  // async deactivate(
  //   @Param('slotId') slotId: string,
  // ) {
  //   return this.service.deactivateSlot(slotId, doctorId);
  // }
}