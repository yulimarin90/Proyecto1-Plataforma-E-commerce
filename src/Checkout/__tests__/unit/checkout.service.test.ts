// src/checkout/__tests__/unit/checkout.service.test.ts
import { CheckoutService } from '../../application/checkout.service';
import { CheckoutRepository } from '../../infraestructure/repositories/checkout.repository';
import { OrdersService } from '../../../Orders/application/order.service';

const mockCheckoutRepository: jest.Mocked<CheckoutRepository> = {
  getProductById: jest.fn(),
  reduceStock: jest.fn()
};

const mockOrdersService: jest.Mocked<OrdersService> = {
  createOrder: jest.fn(),
  getOrdersByUser: jest.fn(),
  getOrderById: jest.fn(),
  cancelOrder: jest.fn(),
  assignTracking: jest.fn(),
  getAllOrders: jest.fn()
} as any;

describe('CheckoutService', () => {
  let checkoutService: CheckoutService;

  beforeEach(() => {
    checkoutService = new CheckoutService();
    (checkoutService as any).checkoutRepo = mockCheckoutRepository;
    (checkoutService as any).ordersService = mockOrdersService;
    jest.clearAllMocks();
  });

  describe('processCheckout', () => {
    it('should process checkout successfully', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 2 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };

      const expectedOrder = {
        id: 1,
        order_number: 'ORD-20231201-12345',
        total_amount: 209.98
      };

      mockCheckoutRepository.getProductById.mockResolvedValue(mockProduct as any);
      mockOrdersService.createOrder.mockResolvedValue(expectedOrder as any);

      const result = await checkoutService.processCheckout(checkoutData);

      expect(mockCheckoutRepository.getProductById).toHaveBeenCalledWith(1);
      expect(mockOrdersService.createOrder).toHaveBeenCalled();
      expect(result.order.id).toBe(1);
      expect(result.resumen.total).toBe(209.98); // 199.98 + 10 shipping
    });

    it('should throw error for insufficient stock', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 20 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };

      mockCheckoutRepository.getProductById.mockResolvedValue(mockProduct as any);

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'Stock insuficiente para Test Product'
      });
    });
  });
});