import { IsUUID, IsDateString, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  doctor_id: string;

  @IsDateString()
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  start_time: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  end_time: string;
}