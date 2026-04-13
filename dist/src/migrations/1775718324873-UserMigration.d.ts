import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UserMigration1775718324873 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
