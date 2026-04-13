import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  mobile_number: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}