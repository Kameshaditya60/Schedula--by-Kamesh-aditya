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
@Roles(Role.PATIENT)
export class BookingController {
  constructor(private service: BookingService) {}

  @Post()
  createBooking(
    @Body() dto: CreateBookingDto,
    @Request() req
  ) {
    const patientId = req.user.user_id;
    return this.service.createBooking(patientId, dto);
  }

  @Post('cancel/:id')
  cancelBooking(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.service.cancelBooking(id, req.user.user_id);
  }


  @Get('my')
  getMyBookings(
    @Request() req )
     {
    return this.service.getPatientBookings(req.user.user_id);
  }


  @Get('doctor')
  getDoctorSchedule(
    @Query('doctor_id') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.service.getDoctorSchedule(doctorId, date);
  }
}