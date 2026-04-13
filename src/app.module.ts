import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DoctorProfileModule } from './doctorProfile/doctor-profile.module';
import { PatientProfileModule } from './patientProfile/patient-profile.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.db_url || 'localhost',
      ssl: {
        rejectUnauthorized: false,
      },
      // // port: 5433,
      username: process.env.db_username,
      password: process.env.db_password,
      database: process.env.db_name,
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
    }),
    UserModule,
    DoctorProfileModule,
    PatientProfileModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService
  ],

})
export class AppModule { }
