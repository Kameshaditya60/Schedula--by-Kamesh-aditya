import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('patient_profile')
export class PatientProfile {
  @PrimaryColumn('uuid')
  patient_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  user: User;

  @Column({ type: 'date', nullable: false })
  date_of_birth: Date;

  @Column({ nullable: false })
  sex: string;
}