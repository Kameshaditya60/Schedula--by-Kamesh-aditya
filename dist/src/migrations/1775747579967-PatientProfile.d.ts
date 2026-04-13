import { MigrationInterface, QueryRunner } from "typeorm";
export declare class PatientProfile1775747579967 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
