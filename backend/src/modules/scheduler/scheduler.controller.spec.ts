import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

describe('SchedulerController', () => {
  let controller: SchedulerController;
  let service: SchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController],
      providers: [
        {
          provide: SchedulerService,
          useValue: {
            getAdminTest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SchedulerController>(SchedulerController);
    service = module.get<SchedulerService>(SchedulerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminTest', () => {
    it('should return admin test response', () => {
      // Arrange
      const expectedResponse = {
        message: 'Scheduler module is working',
        timestamp: '2023-01-01T00:00:00.000Z',
      };
      jest.spyOn(service, 'getAdminTest').mockReturnValue(expectedResponse);

      // Act
      const actualResponse = controller.getAdminTest();

      // Assert
      expect(actualResponse).toEqual(expectedResponse);
      expect(service.getAdminTest).toHaveBeenCalledTimes(1);
    });
  });
});
