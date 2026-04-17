import { MigrationInterface, QueryRunner } from "typeorm";

export class Booking1776409275789 implements MigrationInterface {
    name = 'Booking1776409275789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_22481ba3eb9496310fe6c85462"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f6e13157f2bff4ded4fa14a12c" ON "booking" ("doctor_id", "date", "start_time", "patient_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f6e13157f2bff4ded4fa14a12c"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_22481ba3eb9496310fe6c85462" ON "booking" ("date", "doctor_id", "start_time") `);
    }

}
