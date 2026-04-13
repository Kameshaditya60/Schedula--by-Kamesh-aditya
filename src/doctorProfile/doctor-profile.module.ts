import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DoctorProfile } from "./doctor-profile.entity";
import { DoctorProfileService } from "./doctor-profile.service";
import { DoctorController } from "./doctor-profile.controller";
import { UserModule } from "../user/user.module";

@Module({
    imports: [TypeOrmModule.forFeature([DoctorProfile]), UserModule],
    providers: [DoctorProfileService],
    controllers: [DoctorController],
})
export class DoctorProfileModule { }