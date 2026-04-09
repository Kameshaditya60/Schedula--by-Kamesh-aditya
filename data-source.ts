import { DataSource } from 'typeorm';
import { User } from './src/user/user.entity';
import { Otp } from './src/auth/otp.entity';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
    type: 'postgres',
    host: process.env.db_host || 'localhost',
    port: 5433,
    username: process.env.db_username,
    password: process.env.db_password,
    database: process.env.db_name,
    entities: [User, Otp],
    migrations: ['src/migrations/*.ts'],
});