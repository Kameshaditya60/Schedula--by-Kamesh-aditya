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
exports.DoctorProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const doctor_profile_entity_1 = require("./doctor-profile.entity");
let DoctorProfileService = class DoctorProfileService {
    constructor(repo) {
        this.repo = repo;
    }
    async createOrUpdateDoctorProfile(user_id, dto) {
        let profile = await this.repo.findOne({
            where: { doctor_id: user_id },
        });
        console.log('Existing profile:', profile);
        if (!profile) {
            profile = this.repo.create({
                doctor_id: user_id,
                ...dto,
            });
        }
        else {
            Object.assign(profile, dto);
        }
        return this.repo.save(profile);
    }
    async findAll(filters) {
        const query = this.repo
            .createQueryBuilder('doctor')
            .leftJoinAndSelect('doctor.user', 'user');
        if (filters.specialization) {
            query.andWhere('doctor.specialization ILIKE :spec', {
                spec: `%${filters.specialization}%`,
            });
        }
        if (filters.search) {
            query.andWhere('user.name ILIKE :name', {
                name: `%${filters.search}%`,
            });
        }
        const doctors = await query.getMany();
        if (doctors.length === 0) {
            return {
                success: true,
                message: 'No doctors found',
                data: [],
            };
        }
        console.log('Found doctors:', doctors);
        return {
            success: true,
            count: doctors.length,
            data: doctors,
        };
    }
};
exports.DoctorProfileService = DoctorProfileService;
exports.DoctorProfileService = DoctorProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(doctor_profile_entity_1.DoctorProfile)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], DoctorProfileService);
//# sourceMappingURL=doctor-profile.service.js.map