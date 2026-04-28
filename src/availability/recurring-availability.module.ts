import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringAvailability } from './entity/recurring-availability.entity';
import { RecurringAvailabilityService } from './recurring-availability-service';
import { RecurringAvailabilityController } from './recurring-availability.controller';
import { AvailabilityOverride } from './entity/availability-override.entity';
import { SlotModule } from '../slots/slot.module';
import { Booking } from 'src/booking/booking.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([RecurringAvailability, AvailabilityOverride, Booking]),
        SlotModule,
    ],
    providers: [RecurringAvailabilityService],
    controllers: [RecurringAvailabilityController],
})
export class RecurringAvailabilityModule { }