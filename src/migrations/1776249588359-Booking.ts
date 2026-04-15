import { MigrationInterface, QueryRunner } from "typeorm";

export class Booking1776249588359 implements MigrationInterface {
    name = 'Booking1776249588359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "booking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" uuid NOT NULL, "patient_id" uuid NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "status" character varying NOT NULL DEFAULT 'BOOKED', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_22481ba3eb9496310fe6c85462" ON "booking" ("doctor_id", "date", "start_time") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_22481ba3eb9496310fe6c85462"`);
        await queryRunner.query(`DROP TABLE "booking"`);
    }

}
