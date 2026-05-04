import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1777432049150 implements MigrationInterface {
    name = 'Migrations1777432049150'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."clinic_holiday_leave_type_enum" AS ENUM('HOLIDAY', 'EMERGENCY_CLOSURE')`);
        await queryRunner.query(`CREATE TABLE "clinic_holiday" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "leave_type" "public"."clinic_holiday_leave_type_enum" NOT NULL DEFAULT 'HOLIDAY', "reason" character varying, "start_time" TIME, "end_time" TIME, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_188d3d2069c0d9a4da1725c940f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "clinic_holiday"`);
        await queryRunner.query(`DROP TYPE "public"."clinic_holiday_leave_type_enum"`);
    }

}
