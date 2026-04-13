import { MigrationInterface, QueryRunner } from "typeorm";

export class UserMigration1775718324873 implements MigrationInterface {
    name = 'UserMigration1775718324873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('PATIENT', 'DOCTOR', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "user" ("user_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mobile_number" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL, "name" character varying NOT NULL, "email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9d6d873483c7fae39567c209192" UNIQUE ("mobile_number"), CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
