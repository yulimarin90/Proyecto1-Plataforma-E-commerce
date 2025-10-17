// src/Orders/__tests__/integration/order.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createOrder, getOrderById, getOrdersByUser, setOrdersService } from '../../infraestructure/controllers/order.controller';
import { OrdersService } from '../../application/order.service';

jest.mock('../../application/order.service');
const MockedOrdersService = OrdersService as jest.MockedClass<typeof OrdersService>;

describe('Orders Controller Integration Tests', () => {
  let app: express.Application;
  let mockOrdersService: jest.Mocked<OrdersService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockOrdersService = {
      createOrder: jest.fn(),
      getOrderById: jest.fn(),
      getOrdersByUser: jest.fn(),
      cancelOrder: jest.fn(),
      assignTracking: jest.fn(),
      getAllOrders: jest.fn()
    } as any;

  MockedOrdersService.mockImplementation(() => mockOrdersService);
  // Inyectar la instancia mock en el controlador
  setOrdersService(mockOrdersService);

    app.post('/admin/orders', createOrder);
    app.get('/admin/orders/:order_id', getOrderById);
    app.get('/admin/orders/user/:user_id', getOrdersByUser);
  });

  describe('POST /admin/orders', () => {
    it('should create order successfully', async () => {
      const orderData = {
        userId: 1,
        products: [
          { id: 1, price: 99.99, quantity: 2 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const expectedOrder = {
        id: 1,
        order_number: 'ORD-20231201-12345',
        total_amount: 199.98
      };

      mockOrdersService.createOrder.mockResolvedValue(expectedOrder as any);

      const response = await request(app)
        .post('/admin/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.code).toBe(201);
      expect(response.body.message).toBe('Orden creada exitosamente');
      expect(response.body.data.order_number).toBe('ORD-20231201-12345');
    });

    it('should return error for incomplete data', async () => {
      const invalidOrderData = {
        userId: 1,
        products: []
      };

      mockOrdersService.createOrder.mockRejectedValue({
        status: 400,
        message: 'Datos incompletos'
      });

      const response = await request(app)
        .post('/admin/orders')
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.message).toBe('Datos incompletos');
    });
  });

  describe('GET /admin/orders/:order_id', () => {
    it('should return order by id', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        order_number: 'ORD-20231201-12345',
        user_id: 1,
        total_amount: 199.98,
        status: 'PENDIENTE'
      };

      mockOrdersService.getOrderById.mockResolvedValue(mockOrder as any);

      const response = await request(app)
        .get(`/admin/orders/${orderId}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.id).toBe(orderId);
    });

    it('should return error for invalid order id', async () => {
      const response = await request(app)
        .get('/admin/orders/invalid-id')
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toBe('ID de orden inválido');
    });
  });
});