import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Otp } from './otp.entity';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthService {
    private userRepo;
    private otpRepo;
    private jwtService;
    constructor(userRepo: Repository<User>, otpRepo: Repository<Otp>, jwtService: JwtService);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        token: string;
        user: User;
    }>;
}
