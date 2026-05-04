import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DoctorProfileModule } from './doctorProfile/doctor-profile.module';
import { PatientProfileModule } from './patientProfile/patient-profile.module';
import { RecurringAvailabilityModule } from './availability/recurring-availability.module';
import { SlotModule } from './slots/slot.module';
import { BookingModule } from './booking/booking.module';
import { ClinicHolidayModule } from './clinic-holiday/clinic-holiday.module';

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


      // host: process.env.db_host || 'localhost',
      // port: 5433,
      // username: process.env.db_username,
      // password: process.env.db_password,
      // database: process.env.db_name,

      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
    }),
    UserModule,
    DoctorProfileModule,
    PatientProfileModule,
    RecurringAvailabilityModule,
    SlotModule,
    BookingModule,
    ClinicHolidayModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService
  ],

})
export class AppModule { }
