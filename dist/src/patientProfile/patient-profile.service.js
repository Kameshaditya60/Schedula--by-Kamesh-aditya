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
exports.PatientProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const patient_profile_entity_1 = require("./patient-profile.entity");
let PatientProfileService = class PatientProfileService {
    constructor(repo) {
        this.repo = repo;
    }
    async createOrUpdatePatientProfile(user_id, dto) {
        let profile = await this.repo.findOne({
            where: { patient_id: user_id },
        });
        if (!profile) {
            profile = this.repo.create({
                patient_id: user_id,
                ...dto,
            });
        }
        else {
            Object.assign(profile, dto);
        }
        return this.repo.save(profile);
    }
};
exports.PatientProfileService = PatientProfileService;
exports.PatientProfileService = PatientProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(patient_profile_entity_1.PatientProfile)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], PatientProfileService);
//# sourceMappingURL=patient-profile.service.js.map