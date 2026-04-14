import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DayOfWeek } from './enums/day-of-week.enum';
import { SessionType } from './enums/session-type.enum';
import { DoctorProfile } from '../doctorProfile/doctor-profile.entity';
import { AvailabilityType } from './enums/availablity-type.enum';

@Entity('recurring_availability')
@Index(['doctor_id', 'day_of_week'], { unique: false })
@Index(['doctor_id', 'is_active'], { unique: false })
export class RecurringAvailability {
  @PrimaryGeneratedColumn('uuid')
  slot_id: string;

  @Column('uuid')
  doctor_id: string;

  @ManyToOne(() => DoctorProfile)
  @JoinColumn({ name: 'doctor_id' })
  doctor: DoctorProfile;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  day_of_week: DayOfWeek;

  @Column('time')
  start_time: string;

  @Column('time')
  end_time: string;

  @Column('integer')
  max_appointments: number;

  @Column({
    type: 'enum',
    enum: SessionType,
  })
  session_type: SessionType;

  @Column({
    type: 'enum',
    enum: AvailabilityType,
    default: 'RECURRING',
  })
  availability_type: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}