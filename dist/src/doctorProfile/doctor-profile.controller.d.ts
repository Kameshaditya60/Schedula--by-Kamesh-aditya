import { DoctorProfileService } from './doctor-profile.service';
import { CreateDoctorProfileDto } from './dto/doctor-profile.dto';
export declare class DoctorController {
    private readonly doctorService;
    constructor(doctorService: DoctorProfileService);
    onboard(req: any, dto: CreateDoctorProfileDto): Promise<import("./doctor-profile.entity").DoctorProfile>;
    getAllDoctors(specialization?: string, search?: string): Promise<{
        success: boolean;
        message: string;
        data: any[];
        count?: undefined;
    } | {
        success: boolean;
        count: number;
        data: import("./doctor-profile.entity").DoctorProfile[];
        message?: undefined;
    }>;
}
