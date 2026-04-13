import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PatientProfile } from "./patient-profile.entity";
import { PatientProfileService } from "./patient-profile.service";
import { PatientProfileController } from "./patient-profile.controller";
import { UserModule } from "../user/user.module";

@Module({
    imports: [TypeOrmModule.forFeature([PatientProfile]), UserModule],
    providers: [PatientProfileService],
    controllers: [PatientProfileController],
})
export class PatientProfileModule { }