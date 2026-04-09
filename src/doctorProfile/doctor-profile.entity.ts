import {
    Entity,
    PrimaryColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('doctor_profile')
export class DoctorProfile {
    @PrimaryColumn('uuid')
    doctor_id: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'doctor_id' })
    user: User;

    @Column()
    specialization: string;

    @Column()
    years_experience: number;

    @Column()
    qualifications: string;

    @Column({ nullable: true })
    clinic_name: string;

    @Column({ nullable: true })
    address: string;
}