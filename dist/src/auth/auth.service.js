"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const otp_entity_1 = require("./otp.entity");
const jwt_service_1 = require("@nestjs/jwt/dist/jwt.service");
const exceptions_1 = require("@nestjs/common/exceptions");
let AuthService = class AuthService {
    constructor(userRepo, otpRepo, jwtService) {
        this.userRepo = userRepo;
        this.otpRepo = otpRepo;
        this.jwtService = jwtService;
    }
    async requestOtp(dto) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpEntity = this.otpRepo.create({
            mobile_number: dto.mobile_number,
            otp,
        });
        await this.otpRepo.save(otpEntity);
        console.log('OTP sent:', otp);
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(dto) {
        const record = await this.otpRepo.findOne({
            where: { mobile_number: dto.mobile_number },
            order: { created_at: 'DESC' },
        });
        if (!record || record.otp !== dto.otp)
            throw new exceptions_1.BadRequestException('Invalid OTP');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(otp_entity_1.Otp)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_service_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map