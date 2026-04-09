import { IsString, IsOptional, IsEnum, Matches, IsNotEmpty} from 'class-validator';
import { UserRole } from '../user.entity';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, {
  message: 'Mobile number must be exactly 10 digits',
      })
  mobile_number: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

}