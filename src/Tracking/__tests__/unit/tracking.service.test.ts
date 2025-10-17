// src/tracking/__tests__/unit/tracking.service.test.ts
import { TrackingService } from '../../application/tracking.service';
import { ITrackingRepository } from '../../infraestructure/repositories/tracking.repository';

const mockTrackingRepository: jest.Mocked<ITrackingRepository> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByOrderId: jest.fn(),
  findByTrackingNumber: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateStatus: jest.fn(),
  getActiveTrackings: jest.fn(),
  getTrackingsByStatus: jest.fn()
};

describe('TrackingService', () => {
  let trackingService: TrackingService;

  beforeEach(() => {
    trackingService = new TrackingService(mockTrackingRepository);
    jest.clearAllMocks();
  });

  describe('createTracking', () => {
    it('should create tracking successfully', async () => {
      const trackingData = {
        order_id: 1,
        tracking_number: 'TRK123456789',
        status: 'pending' as const,
        current_location: 'Warehouse',
        carrier_name: 'FedEx',
        is_active: 1
      };

  mockTrackingRepository.findByOrderId.mockResolvedValue(undefined);
  mockTrackingRepository.findByTrackingNumber.mockResolvedValue(undefined);
      mockTrackingRepository.create.mockResolvedValue(1);
      mockTrackingRepository.findById.mockResolvedValue({ id: 1, ...trackingData } as any);

      const result = await trackingService.createTracking(trackingData as any);

      expect(mockTrackingRepository.findByOrderId).toHaveBeenCalledWith(trackingData.order_id);
      expect(mockTrackingRepository.findByTrackingNumber).toHaveBeenCalledWith(trackingData.tracking_number);
      expect(result).toBeDefined();
      expect((result as any).id).toBe(1);
    });

    it('should throw error if tracking already exists for order', async () => {
      const trackingData = {
        order_id: 1,
        tracking_number: 'TRK123456789',
        status: 'pending' as const,
        current_location: 'Warehouse',
        carrier_name: 'FedEx',
        is_active: 1
      };

      mockTrackingRepository.findByOrderId.mockResolvedValue({ id: 1, order_id: 1 } as any);

      await expect(trackingService.createTracking(trackingData as any)).rejects.toMatchObject({
        status: 409,
        message: 'Ya existe un tracking para esta orden'
      });
    });
  });

  describe('getTrackingById', () => {
    it('should return tracking by id', async () => {
      const trackingId = 1;
      const mockTracking = {
        id: trackingId,
        order_id: 1,
        tracking_number: 'TRK123456789',
        status: 'pending'
      };

      mockTrackingRepository.findById.mockResolvedValue(mockTracking as any);

      const result = await trackingService.getTrackingById(trackingId);

      expect(mockTrackingRepository.findById).toHaveBeenCalledWith(trackingId);
      expect(result).toEqual(mockTracking);
    });

    it('should throw error if tracking not found', async () => {
      const trackingId = 999;

      mockTrackingRepository.findById.mockResolvedValue(undefined);

      await expect(trackingService.getTrackingById(trackingId)).rejects.toMatchObject({
        status: 404,
        message: 'Tracking no encontrado'
      });
    });
  });
});