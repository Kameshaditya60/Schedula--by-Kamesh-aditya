import { MigrationInterface, QueryRunner } from "typeorm";

export class RecurringAvailability1776144712178 implements MigrationInterface {
    name = 'RecurringAvailability1776144712178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recurring_availability_day_of_week_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_availability_session_type_enum" AS ENUM('MORNING', 'AFTERNOON', 'EVENING')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_availability_availability_type_enum" AS ENUM('RECURRING', 'CUSTOM')`);
        await queryRunner.query(`CREATE TABLE "recurring_availability" ("slot_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" uuid NOT NULL, "day_of_week" "public"."recurring_availability_day_of_week_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "max_appointments" integer NOT NULL, "session_type" "public"."recurring_availability_session_type_enum" NOT NULL, "availability_type" "public"."recurring_availability_availability_type_enum" NOT NULL DEFAULT 'RECURRING', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_204f17ae66a6052ebf03d549362" PRIMARY KEY ("slot_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_525d17f6669d1e08a5e502b606" ON "recurring_availability" ("doctor_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_87c7cd34866e343413475a2613" ON "recurring_availability" ("doctor_id", "day_of_week") `);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD CONSTRAINT "FK_814ae095c0f609eb6774680a069" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profile"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP CONSTRAINT "FK_814ae095c0f609eb6774680a069"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87c7cd34866e343413475a2613"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_525d17f6669d1e08a5e502b606"`);
        await queryRunner.query(`DROP TABLE "recurring_availability"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availability_availability_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availability_session_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availability_day_of_week_enum"`);
    }

}
