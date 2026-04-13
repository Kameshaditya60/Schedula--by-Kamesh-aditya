import { PatientProfileService } from './patient-profile.service';
import { CreatePatientProfileDto } from './dto/patient-profile.dto';
export declare class PatientProfileController {
    private readonly service;
    constructor(service: PatientProfileService);
    createOrUpdatePatientProfile(req: any, dto: CreatePatientProfileDto): Promise<import("./patient-profile.entity").PatientProfile>;
}
