/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { User, UserRole } from '../user/user.entity';
import { Otp } from './otp.entity';

const MOBILE = '9999999999';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let otpRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ user_id: 'u-1', ...x })),
    };
    otpRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
    };
    jwtService = { sign: jest.fn(() => 'signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Otp), useValue: otpRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('A1: is defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('A2: persists a 6-digit OTP and returns it', async () => {
      const res = await service.requestOtp({ mobile_number: MOBILE });

      expect(res.otp).toMatch(/^\d{6}$/);
      expect(res.message).toBe('OTP sent successfully');
      expect(otpRepo.save).toHaveBeenCalledTimes(1);
      expect(otpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mobile_number: MOBILE, otp: res.otp }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('A3: rejects when no OTP record exists', async () => {
      otpRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ mobile_number: MOBILE, otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('A4: rejects when OTP does not match the latest stored record', async () => {
      otpRepo.findOne.mockResolvedValue({ mobile_number: MOBILE, otp: '999999' });

      await expect(
        service.verifyOtp({ mobile_number: MOBILE, otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('A5: returns JWT signed with user_id and role for an existing user', async () => {
      otpRepo.findOne.mockResolvedValue({ mobile_number: MOBILE, otp: '123456' });
      userRepo.findOne.mockResolvedValue({
        user_id: 'existing-1',
        mobile_number: MOBILE,
        role: UserRole.PATIENT,
        name: 'Existing User',
      });

      const res = await service.verifyOtp({ mobile_number: MOBILE, otp: '123456' });

      expect(res.token).toBe('signed.jwt.token');
      expect(res.message).toBe('Login successful');
      expect(jwtService.sign).toHaveBeenCalledWith({
        user_id: 'existing-1',
        role: UserRole.PATIENT,
      });
      // Existing user should NOT be re-created.
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('A6: auto-creates a new user when none exists for the mobile number', async () => {
      otpRepo.findOne.mockResolvedValue({ mobile_number: MOBILE, otp: '123456' });
      userRepo.findOne.mockResolvedValue(null);

      const res = await service.verifyOtp({ mobile_number: MOBILE, otp: '123456' });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mobile_number: MOBILE, name: 'New User' }),
      );
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(res.token).toBe('signed.jwt.token');
    });

    it('A7: queries the most recent OTP record (orders by created_at DESC)', async () => {
      otpRepo.findOne.mockResolvedValue({ mobile_number: MOBILE, otp: '123456' });
      userRepo.findOne.mockResolvedValue({
        user_id: 'u-1',
        mobile_number: MOBILE,
        role: UserRole.DOCTOR,
      });

      await service.verifyOtp({ mobile_number: MOBILE, otp: '123456' });

      expect(otpRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mobile_number: MOBILE },
          order: { created_at: 'DESC' },
        }),
      );
    });
  });
});
