/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: { getHomepage: jest.Mock; hello: jest.Mock };

  beforeEach(async () => {
    appService = {
      getHomepage: jest.fn(() => 'homepage-text'),
      hello: jest.fn(() => 'hello-text'),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  it('AP1: GET / delegates to AppService.getHomepage', () => {
    expect(controller.getHomepage()).toBe('homepage-text');
    expect(appService.getHomepage).toHaveBeenCalledTimes(1);
  });

  it('AP2: GET /hello delegates to AppService.hello', () => {
    expect(controller.hello()).toBe('hello-text');
    expect(appService.hello).toHaveBeenCalledTimes(1);
  });
});
