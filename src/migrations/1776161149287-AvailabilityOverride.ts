import { MigrationInterface, QueryRunner } from "typeorm";

export class AvailabilityOverride1776161149287 implements MigrationInterface {
    name = 'AvailabilityOverride1776161149287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "availability_override" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" uuid NOT NULL, "date" date NOT NULL, "start_time" TIME, "end_time" TIME, "is_unavailable" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_65233ed10f8dc3e16903e06b317" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bd290130002cf3093ea08c8dda" ON "availability_override" ("doctor_id", "date") `);
        await queryRunner.query(`ALTER TABLE "availability_override" ADD "max_appointments" integer NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."availability_override_session_type_enum" AS ENUM('MORNING', 'AFTERNOON', 'EVENING')`);
        await queryRunner.query(`ALTER TABLE "availability_override" ADD "session_type" "public"."availability_override_session_type_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."availability_override_availability_type_enum" AS ENUM('RECURRING', 'CUSTOM')`);
        await queryRunner.query(`ALTER TABLE "availability_override" ADD "availability_type" "public"."availability_override_availability_type_enum" NOT NULL DEFAULT 'CUSTOM'`);
        await queryRunner.query(`ALTER TABLE "availability_override"
        ALTER COLUMN max_appointments DROP NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "availability_override"
        ALTER COLUMN session_type DROP NOT NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_bd290130002cf3093ea08c8dda"`);
        await queryRunner.query(`DROP TABLE "availability_override"`);
        await queryRunner.query(`ALTER TABLE "availability_override" DROP COLUMN "availability_type"`);
        await queryRunner.query(`DROP TYPE "public"."availability_override_availability_type_enum"`);
        await queryRunner.query(`ALTER TABLE "availability_override" DROP COLUMN "session_type"`);
        await queryRunner.query(`DROP TYPE "public"."availability_override_session_type_enum"`);
        await queryRunner.query(`ALTER TABLE "availability_override" DROP COLUMN "max_appointments"`);
        await queryRunner.query(`ALTER TABLE "availability_override"
        ALTER COLUMN max_appointments SET NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "availability_override"
        ALTER COLUMN session_type SET NOT NULL;`);
    }

}
