
import { IsEnum, IsString, IsInt, IsPositive, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { SessionType } from '../enums/session-type.enum';
import { ScheduleType } from '../enums/schedule-type.enum';

export class CreateRecurringAvailabilityDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true, message: 'Invalid day of week' })
  day_of_week: DayOfWeek[];

  @IsString({ message: 'Start time must be a string in HH:MM format' })
  start_time: string;

  @IsString({ message: 'End time must be a string in HH:MM format' })
  end_time: string;

  @IsInt({ message: 'Max appointments must be an integer' })
  @IsPositive({ message: 'Max appointments must be positive' })
  max_appts_per_slot?: number;

  @IsEnum(ScheduleType, { message: 'Invalid schedule type' })
  schedule_type: ScheduleType;


  @IsEnum(SessionType, { message: 'Invalid session type' })
  session_type: SessionType;

  @IsInt({ message: 'Slot duration must be an integer' })
  @IsPositive({ message: 'Slot duration must be positive' })
  slot_duration: number;
}
