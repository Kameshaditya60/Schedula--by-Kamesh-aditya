/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';

const DOCTOR_ID = 'doc-1';

describe('DoctorProfileService.findAddressById', () => {
  let service: DoctorProfileService;
  let repo: { findOne: jest.Mock };

  beforeEach(async () => {
    repo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorProfileService,
        { provide: getRepositoryToken(DoctorProfile), useValue: repo },
      ],
    }).compile();

    service = module.get(DoctorProfileService);
  });

  it('D1: returns nested address object with identity fields', async () => {
    repo.findOne.mockResolvedValue({
      doctor_id: DOCTOR_ID,
      clinic_name: 'Apollo',
      street: '12 MG Road',
      city: 'Bangalore',
      state: 'KA',
      zip: '560001',
      country: 'India',
      user: { name: 'Dr. Demo' },
    });

    const res = await service.findAddressById(DOCTOR_ID);

    expect(res).toEqual({
      doctor_id: DOCTOR_ID,
      name: 'Dr. Demo',
      clinic_name: 'Apollo',
      address: {
        street: '12 MG Road',
        city: 'Bangalore',
        state: 'KA',
        zip: '560001',
        country: 'India',
      },
    });
  });

  it('D2: throws NotFoundException when doctor does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findAddressById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('D3: returns nulls for unset address fields (no crash)', async () => {
    repo.findOne.mockResolvedValue({
      doctor_id: DOCTOR_ID,
      clinic_name: null,
      street: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      user: null,
    });

    const res = await service.findAddressById(DOCTOR_ID);

    expect(res.address).toEqual({
      street: null,
      city: null,
      state: null,
      zip: null,
      country: null,
    });
    expect(res.name).toBeUndefined();
  });
});
