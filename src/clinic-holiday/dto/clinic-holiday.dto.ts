import {
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ClinicLeaveType } from '../enums/clinic-leave-type.enum';

export class CreateClinicHolidayDto {
  @IsDateString()
  date: string;

  @IsEnum(ClinicLeaveType)
  @IsOptional()
  leave_type?: ClinicLeaveType = ClinicLeaveType.HOLIDAY;

  @IsOptional()
  @IsString()
  reason?: string;

  @ValidateIf((o) => o.leave_type === ClinicLeaveType.EMERGENCY_CLOSURE)
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time must be in HH:MM format',
  })
  start_time?: string;

  @ValidateIf((o) => o.leave_type === ClinicLeaveType.EMERGENCY_CLOSURE)
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in HH:MM format',
  })
  end_time?: string;
}