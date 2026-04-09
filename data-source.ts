import { DataSource } from 'typeorm';
import { User } from './src/user/user.entity';
import { Otp } from './src/auth/otp.entity';
import { DoctorProfile } from './src/doctorProfile/doctor-profile.entity';
import * as dotenv from 'dotenv';
import { PatientProfile } from './src/patientProfile/patient-profile.entity';
dotenv.config();

export default new DataSource({
    type: 'postgres',
    host: process.env.db_host || 'localhost',
    port: 5433,
    username: process.env.db_username,
    password: process.env.db_password,
    database: process.env.db_name,
    entities: [User, Otp, DoctorProfile, PatientProfile],
    migrations: ['src/migrations/*.ts'],
});