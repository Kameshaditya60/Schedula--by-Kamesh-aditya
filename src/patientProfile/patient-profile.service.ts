import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientProfile } from './patient-profile.entity';
import { CreatePatientProfileDto } from './dto/patient-profile.dto';
@Injectable()
export class PatientProfileService {
  constructor(
    @InjectRepository(PatientProfile)
    private repo: Repository<PatientProfile>,
  ) {}

async createOrUpdatePatientProfile(user_id: string, dto: CreatePatientProfileDto) {
  let profile = await this.repo.findOne({
    where: { patient_id: user_id },
  });

  if (!profile) {
    profile = this.repo.create({
      patient_id: user_id,
      ...dto,
    });
  } else {
    Object.assign(profile, dto);
  }

  return this.repo.save(profile);
}
}