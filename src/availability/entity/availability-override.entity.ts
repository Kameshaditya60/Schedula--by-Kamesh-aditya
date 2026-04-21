import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { SessionType } from '../enums/session-type.enum';
import { AvailabilityType } from '../enums/availablity-type.enum';
@Entity('availability_override')
@Index(['doctor_id', 'date'])
export class AvailabilityOverride {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    doctor_id: string;

    @Column('date')
    date: string;

    @Column('time', { nullable: true })
    start_time: string;

    @Column('time', { nullable: true })
    end_time: string;

    @Column('integer', { nullable: true })
    max_appointments?: number;

    @Column({
        type: 'enum',
        enum: SessionType,
        nullable: true,
    })
    session_type?: SessionType;

    @Column({
        type:'integer',
        nullable: true,
    })
    slot_duration?: number;

    @Column({
        type: 'enum',
        enum: AvailabilityType,
        default: 'CUSTOM',
    })
    availability_type: AvailabilityType;


    @Column({ default: false })
    is_unavailable: boolean;

    @CreateDateColumn()
    created_at: Date;
}