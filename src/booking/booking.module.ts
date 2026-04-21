import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Booking } from "./booking.entity";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { SlotModule } from "../slots/slot.module";
import { SlotService } from "src/slots/slot.service";
import { RecurringAvailability } from "src/availability/entity/recurring-availability.entity";
import { AvailabilityOverride } from "src/availability/entity/availability-override.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking, RecurringAvailability, AvailabilityOverride]),
        SlotModule,
    ],
    providers: [BookingService, SlotService],
    controllers: [BookingController],
})
export class BookingModule { }