import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { DoctorProfileService } from './doctor-profile.service';
import { CreateDoctorProfileDto } from './dto/doctor-profile.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('doctors')
export class DoctorController {
    constructor(private readonly doctorService: DoctorProfileService) { }
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR)
    @Post('onboarding')
    async onboard(@Request() req, @Body() dto: CreateDoctorProfileDto) {
 
        return this.doctorService.createOrUpdateDoctorProfile(req.user.user_id, dto);
    }

    @Get()
    async getAllDoctors() {
        return this.doctorService.findAll();
    }
}