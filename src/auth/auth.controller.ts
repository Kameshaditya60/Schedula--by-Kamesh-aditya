import { Body, Controller, Post } from '@nestjs/common';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { AuthService } from './auth.service';

@Controller('auth')

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('request-otp')
    requestOtp(@Body() dto: RequestOtpDto) {
        return this.authService.requestOtp(dto);
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }
}
