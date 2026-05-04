/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt-strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeAll(() => {
    // The strategy constructor reads JWT_SECRET_KEY at instantiation time.
    // .env normally provides it, but pin it here so the test never depends on env state.
    process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test-secret';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('JS1: is defined', () => {
    expect(strategy).toBeDefined();
  });

  it('JS2: validate() returns the user_id and role from the JWT payload', async () => {
    const payload = {
      user_id: 'user-uuid-123',
      role: 'PATIENT',
      iat: 1700000000,
      exp: 1700003600,
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      user_id: 'user-uuid-123',
      role: 'PATIENT',
    });
  });

  it('JS3: validate() carries undefined values through (no defaulting)', async () => {
    const result = await strategy.validate({} as any);
    expect(result).toEqual({ user_id: undefined, role: undefined });
  });
});
