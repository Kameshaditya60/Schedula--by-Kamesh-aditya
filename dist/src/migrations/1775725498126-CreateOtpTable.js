"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOtpTable1775725498126 = void 0;
class CreateOtpTable1775725498126 {
    constructor() {
        this.name = 'CreateOtpTable1775725498126';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "otp" ("id" SERIAL NOT NULL, "mobile_number" character varying NOT NULL, "otp" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "otp"`);
    }
}
exports.CreateOtpTable1775725498126 = CreateOtpTable1775725498126;
//# sourceMappingURL=1775725498126-CreateOtpTable.js.map