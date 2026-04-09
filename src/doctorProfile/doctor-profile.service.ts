import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { CreateDoctorProfileDto } from './dto/doctor-profile.dto';

@Injectable()
export class DoctorProfileService {
    constructor(
        @InjectRepository(DoctorProfile)
        private repo: Repository<DoctorProfile>,
    ) { }

    async createOrUpdateDoctorProfile(user_id: string, dto: CreateDoctorProfileDto) {
        let profile = await this.repo.findOne({
            where: { doctor_id: user_id },
        });
        console.log('Existing profile:', profile);
        if (!profile) {
            profile = this.repo.create({
                doctor_id: user_id,
                ...dto,
            });
        } else {
            Object.assign(profile, dto);
        }

        return this.repo.save(profile);

    }

    async findAll() {
        let doctors = await this.repo.find({
            relations: ['user'],
        });
        console.log('Found doctors:', doctors);
        return doctors;

    }


}


