import { Controller, Post, Body, Get, UseGuards, Param, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RecurringAvailabilityService } from './recurring-availability-service';
import { CreateRecurringAvailabilityDto } from './dto/recurring-availability.dto';
import { CreateOverrideDto } from './dto/availability-override.dto';

@Controller('doctor/availability/recurring')

export class RecurringAvailabilityController {
  constructor(private readonly service: RecurringAvailabilityService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Post()
  async createRecurringAvailability(
    @Request() req, @Body() dto: CreateRecurringAvailabilityDto,

  ) {
    return this.service.create(dto, req.user.user_id);
  }


  @Get()
  async getAvailability(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.service.getAvailabilityByDate(doctorId, date);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Post('override')
  async createOverride(@Body() dto: CreateOverrideDto, @Request() req) {
    return this.service.createOverride(
      dto,
      req.user.user_id

    );
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