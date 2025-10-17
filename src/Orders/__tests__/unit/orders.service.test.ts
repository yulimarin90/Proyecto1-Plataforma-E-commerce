// src/Orders/__tests__/unit/order.service.test.ts
import { OrdersService } from '../../application/order.service';
import { OrdersRepository } from '../../infraestructure/repositories/order.repository';

const mockOrdersRepository: jest.Mocked<OrdersRepository> = {
  createOrder: jest.fn(),
  getOrdersByUser: jest.fn(),
  getOrderById: jest.fn(),
  cancelOrder: jest.fn(),
  assignTracking: jest.fn(),
  getAllOrders: jest.fn()
};

describe('OrdersService', () => {
  let ordersService: OrdersService;

  beforeEach(() => {
    ordersService = new OrdersService();
    (ordersService as any).repo = mockOrdersRepository;
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const orderData = {
        userId: 1,
        products: [
          { id: 1, price: 99.99, quantity: 2 },
          { id: 2, price: 49.99, quantity: 1 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const expectedOrder = {
        id: 1,
        order_number: 'ORD-20231201-12345',
        user_id: 1,
        total_amount: 249.97,
        status: 'PENDIENTE'
      };

      mockOrdersRepository.createOrder.mockResolvedValue(expectedOrder as any);

      const result = await ordersService.createOrder(orderData);

      expect(mockOrdersRepository.createOrder).toHaveBeenCalled();
      expect(result.order_number).toMatch(/^ORD-\d{8}-\d{5}$/);
      expect(result.total_amount).toBe(249.97);
    });

    it('should throw error for incomplete data', async () => {
      const invalidOrderData = {
        userId: 1,
        products: []
      };

      await expect(ordersService.createOrder(invalidOrderData)).rejects.toMatchObject({
        status: 400,
        message: 'Datos incompletos'
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        order_number: 'ORD-20231201-12345',
        user_id: 1,
        total_amount: 249.97,
        status: 'PENDIENTE'
      };

      mockOrdersRepository.getOrderById.mockResolvedValue(mockOrder as any);

      const result = await ordersService.getOrderById(orderId);

      expect(mockOrdersRepository.getOrderById).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockOrder);
    });

    it('should throw error if order not found', async () => {
      const orderId = 999;

      mockOrdersRepository.getOrderById.mockResolvedValue(null);

      await expect(ordersService.getOrderById(orderId)).rejects.toMatchObject({
        status: 404,
        message: 'Orden no encontrada'
      });
    });
  });
});