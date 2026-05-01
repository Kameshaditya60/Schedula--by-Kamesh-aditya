/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { RecurringAvailabilityService } from './recurring-availability-service';
import { RecurringAvailability } from './entity/recurring-availability.entity';
import { AvailabilityOverride } from './entity/availability-override.entity';
import { Booking } from '../booking/booking.entity';
import { SlotService } from '../slots/slot.service';

const DOCTOR_ID = 'doc-1';
const LEAVE_DATE = '2099-06-15';

describe('RecurringAvailabilityService.createOverride', () => {
  let service: RecurringAvailabilityService;
  let overrideTxRepo: { delete: jest.Mock; create: jest.Mock; save: jest.Mock };
  let bookingTxRepo: { createQueryBuilder: jest.Mock };
  let updateBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    overrideTxRepo = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'override-1', ...x })),
    };

    // Fluent query builder chain for the bulk-cancel UPDATE.
    updateBuilder = {
      update: jest.fn(),
      set: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      execute: jest.fn(),
    };
    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.set.mockReturnValue(updateBuilder);
    updateBuilder.where.mockReturnValue(updateBuilder);
    updateBuilder.andWhere.mockReturnValue(updateBuilder);

    bookingTxRepo = {
      createQueryBuilder: jest.fn(() => updateBuilder),
    };

    // DataSource.transaction(cb) calls cb with a manager that returns our mocked repos.
    const dataSource = {
      transaction: jest.fn(async (cb: any) => {
        const manager = {
          getRepository: (entity: any) => {
            if (entity === AvailabilityOverride) return overrideTxRepo;
            if (entity === Booking) return bookingTxRepo;
            throw new Error(`Unexpected entity in transaction: ${entity?.name}`);
          },
        };
        return cb(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringAvailabilityService,
        { provide: SlotService, useValue: {} },
        { provide: getRepositoryToken(RecurringAvailability), useValue: {} },
        { provide: getRepositoryToken(AvailabilityOverride), useValue: {} },
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get<RecurringAvailabilityService>(RecurringAvailabilityService);
  });

  it('L1: when is_unavailable=true, bulk-cancels existing BOOKED appointments for that doctor + date', async () => {
    updateBuilder.execute.mockResolvedValue({ affected: 3 });

    const res = await service.createOverride(
      { date: LEAVE_DATE, is_unavailable: true } as any,
      DOCTOR_ID,
    );

    expect(res.cancelledBookings).toBe(3);
    expect(res.override).toMatchObject({
      doctor_id: DOCTOR_ID,
      date: LEAVE_DATE,
      is_unavailable: true,
    });

    // The bulk-cancel UPDATE must filter by doctor + date + status='BOOKED'
    expect(bookingTxRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(updateBuilder.set).toHaveBeenCalledWith({ status: 'CANCELLED' });
    expect(updateBuilder.where).toHaveBeenCalledWith(
      'doctor_id = :doctor_id',
      { doctor_id: DOCTOR_ID },
    );
    expect(updateBuilder.andWhere).toHaveBeenCalledWith(
      'date = :date',
      { date: LEAVE_DATE },
    );
    expect(updateBuilder.andWhere).toHaveBeenCalledWith(
      'status = :status',
      { status: 'BOOKED' },
    );
  });

  it('L2: when is_unavailable=true with zero existing bookings, returns cancelledBookings=0', async () => {
    updateBuilder.execute.mockResolvedValue({ affected: 0 });

    const res = await service.createOverride(
      { date: LEAVE_DATE, is_unavailable: true } as any,
      DOCTOR_ID,
    );

    expect(res.cancelledBookings).toBe(0);
    expect(updateBuilder.execute).toHaveBeenCalledTimes(1);
  });

  it('L3: when is_unavailable=false, does NOT touch existing bookings', async () => {
    const res = await service.createOverride(
      {
        date: LEAVE_DATE,
        is_unavailable: false,
        start_time: '09:00',
        end_time: '17:00',
      } as any,
      DOCTOR_ID,
    );

    expect(res.cancelledBookings).toBe(0);
    expect(bookingTxRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('L4: deletes any pre-existing override on the same doctor+date before inserting (upsert)', async () => {
    updateBuilder.execute.mockResolvedValue({ affected: 0 });

    await service.createOverride(
      { date: LEAVE_DATE, is_unavailable: true } as any,
      DOCTOR_ID,
    );

    expect(overrideTxRepo.delete).toHaveBeenCalledWith({
      doctor_id: DOCTOR_ID,
      date: LEAVE_DATE,
    });
    // delete must run before save (upsert ordering)
    const deleteOrder = overrideTxRepo.delete.mock.invocationCallOrder[0];
    const saveOrder = overrideTxRepo.save.mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(saveOrder);
  });

  it('L5: rejects is_unavailable=false without start_time/end_time (validation runs BEFORE transaction)', async () => {
    await expect(
      service.createOverride({ date: LEAVE_DATE, is_unavailable: false } as any, DOCTOR_ID),
    ).rejects.toThrow(BadRequestException);

    // No transaction work should have happened.
    expect(overrideTxRepo.delete).not.toHaveBeenCalled();
    expect(bookingTxRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('L6: rolls back the entire transaction if the bulk-cancel fails', async () => {
    updateBuilder.execute.mockRejectedValue(new Error('DB exploded'));

    await expect(
      service.createOverride(
        { date: LEAVE_DATE, is_unavailable: true } as any,
        DOCTOR_ID,
      ),
    ).rejects.toThrow('DB exploded');

    // The override save was attempted inside the (now rolled-back) transaction,
    // but the wrapping transaction promise rejected — atomicity guarantee.
    expect(overrideTxRepo.save).toHaveBeenCalled();
  });
});
