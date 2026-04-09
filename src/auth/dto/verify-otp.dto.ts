import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  mobile_number: string;

  @IsString()
  otp: string;
}