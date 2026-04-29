import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ClinicLeaveType } from '../enums/clinic-leave-type.enum';

@Entity('clinic_holiday')
export class ClinicHoliday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date')
  date: string;

  @Column({
    type: 'enum',
    enum: ClinicLeaveType,
    default: ClinicLeaveType.HOLIDAY,
  })
  leave_type: ClinicLeaveType;

  @Column({ nullable: true })
  reason: string;

  @Column('time', { nullable: true })
  start_time: string;

  @Column('time', { nullable: true })
  end_time: string;

  @CreateDateColumn()
  created_at: Date;
}