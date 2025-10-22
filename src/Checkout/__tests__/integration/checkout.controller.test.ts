
// src/checkout/__tests__/integration/checkout.controller.test.ts
import request from 'supertest';
import express from 'express';
import { CheckoutController, setCheckoutService } from '../../infraestructure/controllers/checkout.controller';
import { CheckoutService } from '../../application/checkout.service';

jest.mock('../../application/checkout.service');
const MockedCheckoutService = CheckoutService as jest.MockedClass<typeof CheckoutService>;

describe('Checkout Controller Integration Tests', () => {
  let app: express.Application;
  let mockCheckoutService: jest.Mocked<CheckoutService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockCheckoutService = {
      processCheckout: jest.fn()
    } as any;

  MockedCheckoutService.mockImplementation(() => mockCheckoutService);
  setCheckoutService(mockCheckoutService);

    app.post('/admin/checkout', (req, res) => CheckoutController.checkout(req, res));
  });

  describe('POST /admin/checkout', () => {
    it('should process checkout successfully', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 2 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const expectedResult = {
        message: 'Checkout completado correctamente',
        order: {
          id: 1,
          order_number: 'ORD-20231201-12345'
        },
        resumen: {
          subtotal: 199.98,
          shippingCost: 10,
          total: 209.98
        }
      };

      mockCheckoutService.processCheckout.mockResolvedValue(expectedResult as any);

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(200);

      expect(response.body.message).toBe('Checkout completado correctamente');
      expect(response.body.order.id).toBe(1);
      expect(response.body.resumen.total).toBe(209.98);
    });

    it('should return error for insufficient stock', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 20 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 400,
        message: 'Stock insuficiente para Test Product'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(400);

      expect(response.body.message).toBe('Stock insuficiente para Test Product');
    });
  });
});