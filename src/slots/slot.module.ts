import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';
import { RecurringAvailability } from 'src/availability/entity/recurring-availability.entity';
import { AvailabilityOverride } from 'src/availability/entity/availability-override.entity';
import { Booking } from 'src/booking/booking.entity';

import { ClinicHolidayModule } from 'src/clinic-holiday/clinic-holiday.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RecurringAvailability, AvailabilityOverride, Booking,]),
        ClinicHolidayModule
    ],
    providers: [SlotService],
    controllers: [SlotController],
    exports: [SlotService],
})
export class SlotModule { }