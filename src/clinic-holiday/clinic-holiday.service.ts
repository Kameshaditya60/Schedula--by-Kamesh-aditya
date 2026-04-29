import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicHoliday } from './entity/clinic-holiday.entity';
import { CreateClinicHolidayDto } from './dto/clinic-holiday.dto';
import { ClinicLeaveType } from './enums/clinic-leave-type.enum';

@Injectable()
export class ClinicHolidayService {
  constructor(
    @InjectRepository(ClinicHoliday)
    private repo: Repository<ClinicHoliday>,
  ) {}

  async create(dto: CreateClinicHolidayDto): Promise<ClinicHoliday> {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (dto.date < todayStr) {
      throw new BadRequestException('Cannot add holiday for past dates');
    }

    // HOLIDAY → only one allowed per date (full day)
    if (dto.leave_type === ClinicLeaveType.HOLIDAY || !dto.leave_type) {
      const existing = await this.repo.findOne({
        where: { date: dto.date, leave_type: ClinicLeaveType.HOLIDAY },
      });

      if (existing) {
        throw new ConflictException(
          `A holiday already exists for ${dto.date}`
        );
      }
    }

    // EMERGENCY_CLOSURE → check time overlap on same date
    if (dto.leave_type === ClinicLeaveType.EMERGENCY_CLOSURE) {
      if (!dto.start_time || !dto.end_time) {
        throw new BadRequestException(
          'start_time and end_time are required for emergency closure'
        );
      }

      if (dto.start_time >= dto.end_time) {
        throw new BadRequestException(
          'start_time must be earlier than end_time'
        );
      }

      const existingClosures = await this.repo.find({
        where: {
          date: dto.date,
          leave_type: ClinicLeaveType.EMERGENCY_CLOSURE,
        },
      });

      const hasOverlap = existingClosures.some(
        (c) =>
          dto.start_time < c.end_time &&
          dto.end_time > c.start_time
      );

      if (hasOverlap) {
        throw new ConflictException(
          `An emergency closure already exists overlapping this time window on ${dto.date}`
        );
      }

      // also check if full day holiday exists for this date
      const fullDayHoliday = await this.repo.findOne({
        where: { date: dto.date, leave_type: ClinicLeaveType.HOLIDAY },
      });

      if (fullDayHoliday) {
        throw new ConflictException(
          `Clinic is already marked as fully closed on ${dto.date}`
        );
      }
    }

    const holiday = this.repo.create(dto);
    return this.repo.save(holiday);
  }

  async findAllClinicHoliday(): Promise<ClinicHoliday[]> {
    return this.repo.find({
      order: { date: 'ASC' },
    });
  }

  async isHoliday(date: string): Promise<{
    isFullDay: boolean;
    partialWindows: { start: string; end: string }[];
  }> {
    const records = await this.repo.find({ where: { date } });

    if (records.length === 0) {
      return { isFullDay: false, partialWindows: [] };
    }

    // check if full day holiday exists
    const fullDay = records.find(
      (r) => r.leave_type === ClinicLeaveType.HOLIDAY
    );

    if (fullDay) {
      return { isFullDay: true, partialWindows: [] };
    }

    // collect emergency closure windows
    const partialWindows = records
      .filter((r) => r.leave_type === ClinicLeaveType.EMERGENCY_CLOSURE)
      .map((r) => ({ start: r.start_time, end: r.end_time }));

    return { isFullDay: false, partialWindows };
  }

  async delete(id: string): Promise<{ message: string }> {
    const holiday = await this.repo.findOne({ where: { id } });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    await this.repo.delete(id);
    return { message: `Holiday on ${holiday.date} deleted successfully` };
  }
}