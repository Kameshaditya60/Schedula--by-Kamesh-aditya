import { Repository } from 'typeorm';
import { PatientProfile } from './patient-profile.entity';
import { CreatePatientProfileDto } from './dto/patient-profile.dto';
export declare class PatientProfileService {
    private repo;
    constructor(repo: Repository<PatientProfile>);
    createOrUpdatePatientProfile(user_id: string, dto: CreatePatientProfileDto): Promise<PatientProfile>;
}
