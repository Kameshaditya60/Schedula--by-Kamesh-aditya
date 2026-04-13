import { MigrationInterface, QueryRunner } from "typeorm";

export class PatientProfile1775747579967 implements MigrationInterface {
    name = 'PatientProfile1775747579967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patient_profile" ("patient_id" uuid NOT NULL, "date_of_birth" date NOT NULL, "sex" character varying NOT NULL, CONSTRAINT "PK_ceb1bf4c18f43dd7889cdaf28d2" PRIMARY KEY ("patient_id"))`);
        await queryRunner.query(`ALTER TABLE "patient_profile" ADD CONSTRAINT "FK_ceb1bf4c18f43dd7889cdaf28d2" FOREIGN KEY ("patient_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient_profile" DROP CONSTRAINT "FK_ceb1bf4c18f43dd7889cdaf28d2"`);
        await queryRunner.query(`DROP TABLE "patient_profile"`);
    }

}
