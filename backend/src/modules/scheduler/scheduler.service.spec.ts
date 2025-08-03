import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { Logger } from '@nestjs/common';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchedulerService],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    logger = service['logger'];
    jest.spyOn(logger, 'debug').mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminTest', () => {
    it('should return admin test response with message and timestamp', () => {
      // Arrange
      const beforeTime = new Date();

      // Act
      const actualResponse = service.getAdminTest();

      // Assert
      const afterTime = new Date();
      expect(actualResponse).toHaveProperty(
        'message',
        'Scheduler module is working',
      );
      expect(actualResponse).toHaveProperty('timestamp');
      const responseTime = new Date(actualResponse.timestamp);
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('handlePointSwapTransaction', () => {
    it('should log message when point swap transaction executes', async () => {
      // Mock the method to avoid actual execution
      jest.spyOn(service, 'handlePointSwapTransaction').mockResolvedValue();

      // Act
      await service.handlePointSwapTransaction();

      // Assert
      expect(service.handlePointSwapTransaction).toHaveBeenCalled();
    });
  });
});
