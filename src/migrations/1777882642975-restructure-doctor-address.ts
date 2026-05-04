import { MigrationInterface, QueryRunner } from "typeorm";

export class RestructureDoctorAddress1777882642975 implements MigrationInterface {
    name = 'RestructureDoctorAddress1777882642975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD "street" character varying`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD "zip" character varying`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD "country" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP COLUMN "zip"`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP COLUMN "street"`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD "address" character varying`);
    }

}
