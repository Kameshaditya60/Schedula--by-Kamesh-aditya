import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
  ValidateIf,
  IsUUID,
  IsNumber,
  Min,
  IsPositive,
  IsInt,
} from 'class-validator';
import { SessionType } from '../enums/session-type.enum';
import { AvailabilityType } from '../enums/availablity-type.enum';
import { ScheduleType } from '../enums/schedule-type.enum';

export class CreateOverrideDto {
  @IsUUID()
  @IsNotEmpty()
  doctor_id: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;


  @ValidateIf((o) => o.is_unavailable === false)
  @IsNotEmpty({ message: 'start_time is required unless is_unavailable = true' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time must be in HH:MM 24-hour format',
  })
  start_time?: string;

  @ValidateIf((o) => o.is_unavailable === false)
  @IsNotEmpty({ message: 'end_time is required unless is_unavailable = true' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in HH:MM 24-hour format',
  })
  end_time?: string;

   @IsInt({ message: 'Max appointments per slot must be an integer' })
  @IsPositive({ message: 'Max appointments per slot must be positive' })
  max_appts_per_slot?: number;

  @IsEnum(SessionType, {
    message: `session_type must be one of: ${Object.values(SessionType).join(', ')}`,
  })
  session_type?: SessionType;

  @IsEnum(ScheduleType, { message: 'Invalid schedule type' })
  schedule_type?: ScheduleType;

  @IsInt({ message: 'Slot duration must be an integer' })
  @IsPositive({ message: 'Slot duration must be positive' })
  slot_duration?: number;

  @IsEnum(AvailabilityType, {
    message: `availability_type must be one of: ${Object.values(AvailabilityType).join(', ')}`,
  })
  @IsOptional()
  availability_type?: AvailabilityType;

  @IsBoolean()
  @IsOptional()
  is_unavailable?: boolean = false;
}