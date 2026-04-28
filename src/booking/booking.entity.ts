import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('booking')
@Index(['doctor_id', 'date', 'start_time','patient_id',], { unique: true }) // 🔥 Prevent double booking at DB level
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  doctor_id: string;

  @Column('uuid')
  patient_id: string;

  @Column('date')
  date: string;

  @Column('time')
  start_time: string;

  @Column('time')
  end_time: string;

  @Column({ default: 'BOOKED' })
  status: 'BOOKED' | 'CANCELLED';

  @Column({ nullable: true })
  token_no: number;

  @CreateDateColumn()
  created_at: Date;
}