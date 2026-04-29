import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ClinicHolidayService } from './clinic-holiday.service';
import { CreateClinicHolidayDto } from './dto/clinic-holiday.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('clinic-holidays')
export class ClinicHolidayController {
  constructor(private readonly service: ClinicHolidayService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Post()
  create(@Body() dto: CreateClinicHolidayDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAllClinicHoliday();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}