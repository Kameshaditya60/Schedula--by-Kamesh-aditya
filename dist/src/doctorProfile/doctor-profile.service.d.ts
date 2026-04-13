import { Repository } from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { CreateDoctorProfileDto } from './dto/doctor-profile.dto';
export declare class DoctorProfileService {
    private repo;
    constructor(repo: Repository<DoctorProfile>);
    createOrUpdateDoctorProfile(user_id: string, dto: CreateDoctorProfileDto): Promise<DoctorProfile>;
    findAll(filters: {
        specialization?: string;
        search?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: any[];
        count?: undefined;
    } | {
        success: boolean;
        count: number;
        data: DoctorProfile[];
        message?: undefined;
    }>;
}
