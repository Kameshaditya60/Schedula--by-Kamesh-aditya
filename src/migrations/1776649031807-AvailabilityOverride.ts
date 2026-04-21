import { MigrationInterface, QueryRunner } from "typeorm";

export class AvailabilityOverride1776649031807 implements MigrationInterface {
    name = 'AvailabilityOverride1776649031807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability_override" RENAME COLUMN "max_appointments" TO "max_appts_per_slot"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability_override" RENAME COLUMN "max_appts_per_slot" TO "max_appointments"`);
    }

}
