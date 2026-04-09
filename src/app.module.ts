import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
      TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.db_host || 'localhost',
      port: 5433,
      username: process.env.db_username,
      password: process.env.db_password ,
      database: process.env.db_name ,
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService
  ],
  
})
export class AppModule {}
