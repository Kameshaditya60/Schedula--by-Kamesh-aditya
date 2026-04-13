"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientProfile1775747579967 = void 0;
class PatientProfile1775747579967 {
    constructor() {
        this.name = 'PatientProfile1775747579967';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "patient_profile" ("patient_id" uuid NOT NULL, "date_of_birth" date NOT NULL, "sex" character varying NOT NULL, CONSTRAINT "PK_ceb1bf4c18f43dd7889cdaf28d2" PRIMARY KEY ("patient_id"))`);
        await queryRunner.query(`ALTER TABLE "patient_profile" ADD CONSTRAINT "FK_ceb1bf4c18f43dd7889cdaf28d2" FOREIGN KEY ("patient_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "patient_profile" DROP CONSTRAINT "FK_ceb1bf4c18f43dd7889cdaf28d2"`);
        await queryRunner.query(`DROP TABLE "patient_profile"`);
    }
}
exports.PatientProfile1775747579967 = PatientProfile1775747579967;
//# sourceMappingURL=1775747579967-PatientProfile.js.map