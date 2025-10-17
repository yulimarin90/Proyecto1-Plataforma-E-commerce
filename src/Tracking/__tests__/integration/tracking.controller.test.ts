// src/tracking/__tests__/integration/tracking.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createTracking, getTrackingById, getTrackings, setTrackingService } from '../../infraestructure/controllers/tracking.controller';
import { TrackingService } from '../../application/tracking.service';

jest.mock('../../application/tracking.service');
const MockedTrackingService = TrackingService as jest.MockedClass<typeof TrackingService>;

describe('Tracking Controller Integration Tests', () => {
  let app: express.Application;
  let mockTrackingService: jest.Mocked<TrackingService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockTrackingService = {
      createTracking: jest.fn(),
      getAllTrackings: jest.fn(),
      getTrackingById: jest.fn(),
      getTrackingByNumber: jest.fn(),
      getTrackingByOrder: jest.fn(),
      updateTracking: jest.fn(),
      deleteTracking: jest.fn(),
      updateTrackingStatus: jest.fn(),
      getActiveTrackings: jest.fn(),
      getTrackingsByStatus: jest.fn(),
      generateTrackingNumber: jest.fn(),
      calculateEstimatedDeliveryDate: jest.fn()
    } as any;

  MockedTrackingService.mockImplementation(() => mockTrackingService);
  // Inyectar la instancia mock en el controlador
  setTrackingService(mockTrackingService);

    app.post('/admin/trackings', createTracking);
    app.get('/trackings', getTrackings);
    app.get('/trackings/:id', getTrackingById);
  });

  describe('POST /admin/trackings', () => {
    it('should create tracking successfully', async () => {
      const trackingData = {
        order_id: 1,
        tracking_number: 'TRK123456789',
        status: 'pending',
        current_location: 'Warehouse',
        carrier_name: 'FedEx',
        is_active: true
      };

      const expectedTracking = {
        id: 1,
        ...trackingData,
        is_active: 1
      };

      mockTrackingService.createTracking.mockResolvedValue(expectedTracking as any);

      const response = await request(app)
        .post('/admin/trackings')
        .send(trackingData)
        .expect(201);

      expect(response.body.message).toBe('Tracking creado con éxito');
      expect(response.body.tracking.id).toBe(1);
    });

    it('should return error for duplicate tracking', async () => {
      const trackingData = {
        order_id: 1,
        tracking_number: 'TRK123456789',
        status: 'pending',
        current_location: 'Warehouse',
        carrier_name: 'FedEx'
      };

      mockTrackingService.createTracking.mockRejectedValue({
        status: 409,
        message: 'Ya existe un tracking para esta orden'
      });

      const response = await request(app)
        .post('/admin/trackings')
        .send(trackingData)
        .expect(409);

      expect(response.body.message).toBe('Ya existe un tracking para esta orden');
    });
  });

  describe('GET /trackings', () => {
    it('should return all trackings', async () => {
      const mockTrackings = [
        {
          id: 1,
          order_id: 1,
          tracking_number: 'TRK123456789',
          status: 'pending',
          status_display: 'Pendiente'
        },
        {
          id: 2,
          order_id: 2,
          tracking_number: 'TRK987654321',
          status: 'in_transit',
          status_display: 'En tránsito'
        }
      ];

      mockTrackingService.getAllTrackings.mockResolvedValue(mockTrackings as any);

      const response = await request(app)
        .get('/trackings')
        .expect(200);

      expect(response.body.trackings).toHaveLength(2);
      expect(response.body.trackings[0].status_display).toBe('Pendiente');
    });
  });
});