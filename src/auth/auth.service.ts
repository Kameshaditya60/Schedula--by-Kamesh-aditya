import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Otp } from './otp.entity';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { BadRequestException } from '@nestjs/common/exceptions';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Otp) private otpRepo: Repository<Otp>,
        private jwtService: JwtService,
    ) { }

    async requestOtp(dto: RequestOtpDto) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpEntity = this.otpRepo.create({
            mobile_number: dto.mobile_number,
            otp,
        });

        await this.otpRepo.save(otpEntity);

        console.log('OTP sent:', otp);

        return {
            message: 'OTP sent successfully',
            otp: otp
        };
    }

    async verifyOtp(dto: VerifyOtpDto) {
        const record = await this.otpRepo.findOne({
            where: { mobile_number: dto.mobile_number },
            order: { created_at: 'DESC' },
        });

        if (!record || record.otp !== dto.otp)
            throw new BadRequestException('Invalid OTP');

        let user = await this.userRepo.findOne({
            where: { mobile_number: dto.mobile_number },
        });

        if (!user) {
            user = this.userRepo.create({
                mobile_number: dto.mobile_number,
                name: 'New User',
            });
            await this.userRepo.save(user);
        }

        const token = this.jwtService.sign({
            user_id: user.user_id,
            role: user.role,
        });

        return {
            message: 'Login successful',
            token,
            user,
        };
    }
}
