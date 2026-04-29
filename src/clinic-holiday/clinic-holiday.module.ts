import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicHoliday } from './entity/clinic-holiday.entity';
import { ClinicHolidayService } from './clinic-holiday.service';
import { ClinicHolidayController } from './clinic-holiday.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicHoliday])],
  providers: [ClinicHolidayService],
  controllers: [ClinicHolidayController],
  exports: [ClinicHolidayService],
})
export class ClinicHolidayModule {}