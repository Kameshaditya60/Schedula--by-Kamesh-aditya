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


    async findAll(filters: { specialization?: string; search?: string }) {
        const query = this.repo
            .createQueryBuilder('doctor')
            .leftJoinAndSelect('doctor.user', 'user');

        if (filters.specialization) {
            query.andWhere('doctor.specialization ILIKE :spec', {
                spec: `%${filters.specialization}%`,
            });
        }

        if (filters.search) {
            query.andWhere('user.name ILIKE :name', {
                name: `%${filters.search}%`,
            });
        }

        const doctors = await query.getMany();

        if (doctors.length === 0) {
            return {
                success: true,
                message: 'No doctors found',
                data: [],
            };
        }
        console.log('Found doctors:', doctors);
        return {
            success: true,
            count: doctors.length,
            data: doctors,
        };
    }


}


