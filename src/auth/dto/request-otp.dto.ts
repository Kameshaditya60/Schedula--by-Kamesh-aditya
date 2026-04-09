import { IsNotEmpty, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  mobile_number: string;
}