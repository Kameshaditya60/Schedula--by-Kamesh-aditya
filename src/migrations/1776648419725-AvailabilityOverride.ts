import { MigrationInterface, QueryRunner } from "typeorm";

export class AvailabilityOverride1776648419725 implements MigrationInterface {
    name = 'AvailabilityOverride1776648419725'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."availability_override_schedule_type_enum" AS ENUM('STREAM', 'WAVE')`);
        await queryRunner.query(`ALTER TABLE "availability_override" ADD "schedule_type" "public"."availability_override_schedule_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability_override" DROP COLUMN "schedule_type"`);
        await queryRunner.query(`DROP TYPE "public"."availability_override_schedule_type_enum"`);
    }

}
