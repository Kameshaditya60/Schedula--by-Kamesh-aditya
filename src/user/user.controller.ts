import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';

@Controller('auth')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('signup')
    signup(@Body() dto: SignupDto) {
        return this.userService.signup(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR)
    @Get('doctor-only')
    doctorOnly() {
        return "This route is only accessible to doctors.";
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Get('patient-only')
    patientOnly() {
        return "This route is only accessible to patients.";
    }
}
