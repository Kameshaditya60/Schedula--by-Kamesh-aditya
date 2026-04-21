import { MigrationInterface, QueryRunner } from "typeorm";

export class RecurringAvailability1776335834465 implements MigrationInterface {
    name = 'RecurringAvailability1776335834465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "max_appointments"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "max_appts_per_slot" integer`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_availability_schedule_type_enum" AS ENUM('STREAM', 'WAVE')`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "schedule_type" "public"."recurring_availability_schedule_type_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "schedule_type"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availability_schedule_type_enum"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "max_appts_per_slot"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "max_appointments" integer NOT NULL`);
    }

}
