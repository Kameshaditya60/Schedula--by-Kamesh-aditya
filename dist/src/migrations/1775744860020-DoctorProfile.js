"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorProfile1775744860020 = void 0;
class DoctorProfile1775744860020 {
    constructor() {
        this.name = 'DoctorProfile1775744860020';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "doctor_profile" ("doctor_id" uuid NOT NULL, "specialization" character varying NOT NULL, "years_experience" integer NOT NULL, "qualifications" character varying NOT NULL, "clinic_name" character varying, "address" character varying, CONSTRAINT "PK_8e0dcc21755aee3b5cd7be7714a" PRIMARY KEY ("doctor_id"))`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD CONSTRAINT "FK_8e0dcc21755aee3b5cd7be7714a" FOREIGN KEY ("doctor_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP CONSTRAINT "FK_8e0dcc21755aee3b5cd7be7714a"`);
        await queryRunner.query(`DROP TABLE "doctor_profile"`);
    }
}
exports.DoctorProfile1775744860020 = DoctorProfile1775744860020;
//# sourceMappingURL=1775744860020-DoctorProfile.js.map