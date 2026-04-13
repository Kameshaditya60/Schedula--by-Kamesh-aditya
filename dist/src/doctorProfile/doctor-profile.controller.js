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
exports.DoctorController = void 0;
const common_1 = require("@nestjs/common");
const doctor_profile_service_1 = require("./doctor-profile.service");
const doctor_profile_dto_1 = require("./dto/doctor-profile.dto");
const jwt_guard_1 = require("../auth/jwt/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_enum_1 = require("../auth/roles.enum");
let DoctorController = class DoctorController {
    constructor(doctorService) {
        this.doctorService = doctorService;
    }
    async onboard(req, dto) {
        return this.doctorService.createOrUpdateDoctorProfile(req.user.user_id, dto);
    }
    async getAllDoctors(specialization, search) {
        if (specialization && specialization.length < 2) {
            throw new common_1.BadRequestException('Specialization value too short');
        }
        if (search && search.length < 2) {
            throw new common_1.BadRequestException('Search must be at least 2 characters');
        }
        return this.doctorService.findAll({ specialization, search });
    }
};
exports.DoctorController = DoctorController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.DOCTOR),
    (0, common_1.Post)('onboarding'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, doctor_profile_dto_1.CreateDoctorProfileDto]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "onboard", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('specialization')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "getAllDoctors", null);
exports.DoctorController = DoctorController = __decorate([
    (0, common_1.Controller)('doctors'),
    __metadata("design:paramtypes", [doctor_profile_service_1.DoctorProfileService])
], DoctorController);
//# sourceMappingURL=doctor-profile.controller.js.map