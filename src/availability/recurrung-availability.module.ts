import {Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringAvailability } from './recurring-availability.entity';
import { RecurringAvailabilityService } from './recurring-availability-service';
import { RecurringAvailabilityController } from './recurring-availability.controller';
@Module({
    imports: [TypeOrmModule.forFeature([RecurringAvailability])],
    providers: [RecurringAvailabilityService],
    controllers: [RecurringAvailabilityController],
})
export class RecurringAvailabilityModule {}