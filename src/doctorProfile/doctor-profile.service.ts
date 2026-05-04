import { Injectable, NotFoundException } from '@nestjs/common';
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
        return {
            success: true,
            count: doctors.length,
            data: doctors,
        };
    }


    async findAddressById(doctor_id: string) {
        const profile = await this.repo.findOne({
            where: { doctor_id },
            relations: ['user'],
            select: {
                doctor_id: true,
                clinic_name: true,
                street: true,
                city: true,
                state: true,
                zip: true,
                country: true,
                user: { name: true },
            },
        });

        if (!profile) {
            throw new NotFoundException(`Doctor not found: ${doctor_id}`);
        }

        return {
            doctor_id: profile.doctor_id,
            name: profile.user?.name,
            clinic_name: profile.clinic_name,
            address: {
                street: profile.street,
                city: profile.city,
                state: profile.state,
                zip: profile.zip,
                country: profile.country,
            },
        };
    }
}


