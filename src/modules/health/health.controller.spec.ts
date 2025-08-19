import { ResponseUtil } from '@common/utils/response.util';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: 'HealthService',
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status successfully', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 100,
        mongodb: 'connected',
        redis: 'connected',
        supabase: 'connected',
      };

      mockHealthService.checkHealth.mockResolvedValue(mockHealthData);

      const result = await controller.checkHealth();

      expect(mockHealthService.checkHealth).toHaveBeenCalled();
      expect(result).toEqual(
        ResponseUtil.success(mockHealthData, 'Health check completed'),
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service unavailable');
      mockHealthService.checkHealth.mockRejectedValue(error);

      await expect(controller.checkHealth()).rejects.toThrow(
        'Service unavailable',
      );
    });
  });
});
