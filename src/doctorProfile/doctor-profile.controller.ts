import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
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
    async getAllDoctors(
        @Query('specialization') specialization?: string,
        @Query('search') search?: string,
    ) {
        if (specialization && specialization.length < 2) {
            throw new BadRequestException('Specialization value too short');
        }

        if (search && search.length < 2) {
            throw new BadRequestException('Search must be at least 2 characters');
        }
        return this.doctorService.findAll({ specialization, search });
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/address')
    async getDoctorAddress(@Param('id') id: string) {
        return this.doctorService.findAddressById(id);
    }
}