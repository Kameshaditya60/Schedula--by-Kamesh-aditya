import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateOtpTable1775725498126 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
