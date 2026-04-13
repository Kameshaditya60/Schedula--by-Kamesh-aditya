"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMigration1775718324873 = void 0;
class UserMigration1775718324873 {
    constructor() {
        this.name = 'UserMigration1775718324873';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('PATIENT', 'DOCTOR', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "user" ("user_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mobile_number" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL, "name" character varying NOT NULL, "email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9d6d873483c7fae39567c209192" UNIQUE ("mobile_number"), CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }
}
exports.UserMigration1775718324873 = UserMigration1775718324873;
//# sourceMappingURL=1775718324873-UserMigration.js.map