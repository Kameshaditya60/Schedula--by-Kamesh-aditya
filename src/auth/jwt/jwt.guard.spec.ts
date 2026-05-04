/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('JG1: is defined', () => {
    expect(guard).toBeDefined();
  });

  it('JG2: handleRequest returns the user when validation succeeds', () => {
    const user = { user_id: 'u-1', role: 'PATIENT' };
    const result = guard.handleRequest(null, user, undefined);
    expect(result).toBe(user);
  });

  it('JG3: handleRequest re-throws the original error when one is provided', () => {
    const err = new Error('jwt expired');
    expect(() => guard.handleRequest(err, null, undefined)).toThrow(err);
  });

  it('JG4: handleRequest throws UnauthorizedException when user is missing and no error', () => {
    expect(() => guard.handleRequest(null, null, undefined)).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.handleRequest(null, null, undefined)).toThrow(
      /invalid or missing token/i,
    );
  });

  it('JG5: handleRequest throws UnauthorizedException when user is undefined', () => {
    expect(() => guard.handleRequest(null, undefined, undefined)).toThrow(
      UnauthorizedException,
    );
  });
});
