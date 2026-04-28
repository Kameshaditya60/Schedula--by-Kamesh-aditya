import { MigrationInterface, QueryRunner } from "typeorm";

export class BookingTokenNo1777272417020 implements MigrationInterface {
    name = 'BookingTokenNo1777272417020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" ADD "token_no" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "token_no"`);
    }

}
