import request from 'supertest';
import express from 'express';
import { CheckoutController, setCheckoutService } from '../../infraestructure/controllers/checkout.controller';

describe('Checkout Controller Integration Tests', () => {
  let app: express.Application;
  let mockCheckoutService: jest.Mocked<any>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockCheckoutService = {
      processCheckout: jest.fn()
    } as any;

  // Inyectar mock directamente en el controlador
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

    it('should return error for missing user', async () => {
      const checkoutData = {
        products: [{ id: 1, quantity: 2 }],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 400,
        message: 'El usuario es obligatorio'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(400);

      expect(response.body.message).toBe('El usuario es obligatorio');
    });

    it('should return error for empty products', async () => {
      const checkoutData = {
        userId: 1,
        products: [],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 400,
        message: 'No hay productos en el carrito'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(400);

      expect(response.body.message).toBe('No hay productos en el carrito');
    });

    it('should return error for missing shipping address', async () => {
      const checkoutData = {
        userId: 1,
        products: [{ id: 1, quantity: 2 }],
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 400,
        message: 'La dirección de envío es obligatoria'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(400);

      expect(response.body.message).toBe('La dirección de envío es obligatoria');
    });

    it('should return error for missing payment method', async () => {
      const checkoutData = {
        userId: 1,
        products: [{ id: 1, quantity: 2 }],
        shipping_address: 'Test Address'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 400,
        message: 'El método de pago es obligatorio'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(400);

      expect(response.body.message).toBe('El método de pago es obligatorio');
    });

    it('should handle userId from request body when not provided', async () => {
      const checkoutData = {
        products: [{ id: 1, quantity: 2 }],
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
        .set('Authorization', 'Bearer mock-token')
        .send(checkoutData)
        .expect(200);

      expect(response.body.message).toBe('Checkout completado correctamente');
    });

    it('should return error for non-existent product', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 999, quantity: 2 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 404,
        message: 'Producto 999 no encontrado'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(404);

      expect(response.body.message).toBe('Producto 999 no encontrado');
    });

    it('should return error for invalid quantity', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 0 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue({
        status: 400,
        message: 'Cantidad o precio inválido para Test Product'
      });

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(400);

      expect(response.body.message).toBe('Cantidad o precio inválido para Test Product');
    });

    it('should handle multiple products checkout', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 1 }
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
          subtotal: 250,
          shippingCost: 10,
          total: 260
        }
      };

      mockCheckoutService.processCheckout.mockResolvedValue(expectedResult as any);

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(200);

      expect(response.body.resumen.subtotal).toBe(250);
      expect(response.body.resumen.total).toBe(260);
    });

    it('should return generic error for unexpected errors', async () => {
      const checkoutData = {
        userId: 1,
        products: [{ id: 1, quantity: 2 }],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutService.processCheckout.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/admin/checkout')
        .send(checkoutData)
        .expect(500);

      expect(response.body.message).toBe('Error interno en el servidor');
    });
  });
});