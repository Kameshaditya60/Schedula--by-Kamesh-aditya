import { MigrationInterface, QueryRunner } from "typeorm";

export class Availability1776236944816 implements MigrationInterface {
    name = 'Availability1776236944816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "slot_duration" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "availability_override" ADD "slot_duration" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability_override" DROP COLUMN "slot_duration"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "slot_duration"`);
    }

}
