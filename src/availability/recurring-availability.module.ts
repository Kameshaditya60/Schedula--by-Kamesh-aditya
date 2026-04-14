import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringAvailability } from './recurring-availability.entity';
import { RecurringAvailabilityService } from './recurring-availability-service';
import { RecurringAvailabilityController } from './recurring-availability.controller';
import { AvailabilityOverride } from './availability-override.entity';
@Module({
    imports: [TypeOrmModule.forFeature([RecurringAvailability, AvailabilityOverride])],
    providers: [RecurringAvailabilityService],
    controllers: [RecurringAvailabilityController],
})
export class RecurringAvailabilityModule { }