import { MigrationInterface, QueryRunner } from "typeorm";
export declare class DoctorProfile1775744860020 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
