import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Booking } from "./booking.entity";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { SlotModule } from "../slots/slot.module";
import { RecurringAvailability } from "src/availability/entity/recurring-availability.entity";
import { AvailabilityOverride } from "src/availability/entity/availability-override.entity";
import { ClinicHoliday } from "src/clinic-holiday/entity/clinic-holiday.entity";
import { ClinicHolidayModule } from "src/clinic-holiday/clinic-holiday.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking, RecurringAvailability, AvailabilityOverride, ClinicHoliday, ]),
        SlotModule,
        ClinicHolidayModule,
    ],
    providers: [BookingService],
    controllers: [BookingController],
})
export class BookingModule { }