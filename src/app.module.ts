import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';


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
    }),
   
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
