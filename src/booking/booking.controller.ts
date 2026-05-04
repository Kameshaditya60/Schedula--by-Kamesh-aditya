import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';

import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private service: BookingService) {}

  @Roles(Role.PATIENT)
  @Post()
  createBooking(
    @Body() dto: CreateBookingDto,
    @Request() req
  ) {
    const patientId = req.user.user_id;
    return this.service.createBooking(patientId, dto);
  }


  @Roles(Role.PATIENT)
  @Post('cancel/:id')
  cancelBooking(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.service.cancelBooking(id, req.user.user_id);
  }


  @Roles(Role.PATIENT)
  @Get('my')
  getMyBookings(
    @Query('date') date: string,
    @Request() req
  ) {
    return this.service.getPatientBookings(req.user.user_id, date);
  }


  @Roles(Role.DOCTOR)
  @Get('doctor')
  getDoctorSchedule(
    @Query('doctor_id') doctorId: string,
    @Query('patient_id') patientId: string,
    @Query('date') date: string,
  ) {
    return this.service.getDoctorSchedule(doctorId, date);
  }
}