import { MigrationInterface, QueryRunner } from "typeorm";

export class DoctorProfile1775744860020 implements MigrationInterface {
    name = 'DoctorProfile1775744860020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "doctor_profile" ("doctor_id" uuid NOT NULL, "specialization" character varying NOT NULL, "years_experience" integer NOT NULL, "qualifications" character varying NOT NULL, "clinic_name" character varying, "address" character varying, CONSTRAINT "PK_8e0dcc21755aee3b5cd7be7714a" PRIMARY KEY ("doctor_id"))`);
        await queryRunner.query(`ALTER TABLE "doctor_profile" ADD CONSTRAINT "FK_8e0dcc21755aee3b5cd7be7714a" FOREIGN KEY ("doctor_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_profile" DROP CONSTRAINT "FK_8e0dcc21755aee3b5cd7be7714a"`);
        await queryRunner.query(`DROP TABLE "doctor_profile"`);
    }

}
