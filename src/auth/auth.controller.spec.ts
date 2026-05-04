/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { requestOtp: jest.Mock; verifyOtp: jest.Mock };

  beforeEach(async () => {
    authService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('AC1: is defined', () => {
    expect(controller).toBeDefined();
  });

  it('AC2: requestOtp delegates to AuthService.requestOtp with the dto', async () => {
    const dto = { mobile_number: '9999999999' };
    authService.requestOtp.mockResolvedValue({ message: 'OTP sent successfully', otp: '123456' });

    const res = await controller.requestOtp(dto);

    expect(authService.requestOtp).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: 'OTP sent successfully', otp: '123456' });
  });

  it('AC3: verifyOtp delegates to AuthService.verifyOtp with the dto', async () => {
    const dto = { mobile_number: '9999999999', otp: '123456' };
    authService.verifyOtp.mockResolvedValue({
      message: 'Login successful',
      token: 'jwt-token',
      user: { user_id: 'u-1', role: 'PATIENT' },
    });

    const res = await controller.verifyOtp(dto);

    expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
    expect(res.token).toBe('jwt-token');
  });
});
