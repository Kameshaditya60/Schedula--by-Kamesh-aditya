import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PatientProfileService } from './patient-profile.service';
import { CreatePatientProfileDto } from './dto/patient-profile.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';

@Controller('patients')
export class PatientProfileController {
  constructor(private readonly service: PatientProfileService) {}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
@Post('profile')
async createOrUpdatePatientProfile(
  @Req() req,
  @Body() dto: CreatePatientProfileDto,
) {
  return this.service.createOrUpdatePatientProfile(
    req.user.user_id,
    dto,
  );
}

}