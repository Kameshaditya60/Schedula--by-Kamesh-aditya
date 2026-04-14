
import { IsEnum, IsString, IsInt, IsPositive, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { SessionType } from '../enums/session-type.enum';

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
  max_appointments: number;

  @IsEnum(SessionType, { message: 'Invalid session type' })
  session_type: SessionType;
}
