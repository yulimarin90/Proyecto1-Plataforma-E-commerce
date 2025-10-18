import { CheckoutService } from '../../application/checkout.service';
import { CheckoutRepository } from '../../infraestructure/repositories/checkout.repository';
import { OrdersService } from '../../../Orders/application/order.service';

const createMockCheckoutRepository = (): jest.Mocked<CheckoutRepository> => ({
  getProductById: jest.fn(),
  reduceStock: jest.fn()
});

const createMockOrdersService = (): jest.Mocked<OrdersService> => ({
  createOrder: jest.fn(),
  getOrdersByUser: jest.fn(),
  getOrderById: jest.fn(),
  cancelOrder: jest.fn(),
  assignTracking: jest.fn(),
  getAllOrders: jest.fn()
} as any);

describe('CheckoutService', () => {
  let checkoutService: CheckoutService;
  let mockCheckoutRepository: jest.Mocked<CheckoutRepository>;
  let mockOrdersService: jest.Mocked<OrdersService>;

  beforeEach(() => {
    mockCheckoutRepository = createMockCheckoutRepository();
    mockOrdersService = createMockOrdersService();
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
        total_amount: 199.98
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

    it('should throw error for missing user', async () => {
      const checkoutData = {
        products: [{ id: 1, quantity: 2 }],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'El usuario es obligatorio'
      });
    });

    it('should throw error for empty products', async () => {
      const checkoutData = {
        userId: 1,
        products: [],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'No hay productos en el carrito'
      });
    });

    it('should throw error for missing shipping address', async () => {
      const checkoutData = {
        userId: 1,
        products: [{ id: 1, quantity: 2 }],
        payment_method: 'Credit Card'
      };

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'La dirección de envío es obligatoria'
      });
    });

    it('should throw error for missing payment method', async () => {
      const checkoutData = {
        userId: 1,
        products: [{ id: 1, quantity: 2 }],
        shipping_address: 'Test Address'
      };

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'El método de pago es obligatorio'
      });
    });

    it('should calculate free shipping for orders over 50000', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 10 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 6000,
        stock: 20
      };

      const expectedOrder = {
        id: 1,
        order_number: 'ORD-20231201-12345',
        total_amount: 60000
      };

      mockCheckoutRepository.getProductById.mockResolvedValue(mockProduct as any);
      mockOrdersService.createOrder.mockResolvedValue(expectedOrder as any);

      const result = await checkoutService.processCheckout(checkoutData);

      expect(result.resumen.shippingCost).toBe(0);
      expect(result.resumen.total).toBe(60000);
    });

    it('should handle multiple products', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 1 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      const mockProduct1 = {
        id: 1,
        name: 'Test Product 1',
        price: 100,
        stock: 10
      };

      const mockProduct2 = {
        id: 2,
        name: 'Test Product 2',
        price: 50,
        stock: 5
      };

      const expectedOrder = {
        id: 1,
        order_number: 'ORD-20231201-12345',
        total_amount: 250
      };

      mockCheckoutRepository.getProductById
        .mockResolvedValueOnce(mockProduct1 as any)
        .mockResolvedValueOnce(mockProduct2 as any);
      mockOrdersService.createOrder.mockResolvedValue(expectedOrder as any);

      const result = await checkoutService.processCheckout(checkoutData);

      expect(result.resumen.subtotal).toBe(250);
      expect(result.resumen.shippingCost).toBe(10);
      expect(result.resumen.total).toBe(260);
    });

    it('should throw error for non-existent product', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 999, quantity: 2 }
        ],
        shipping_address: 'Test Address',
        payment_method: 'Credit Card'
      };

      mockCheckoutRepository.getProductById.mockResolvedValue(null);

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 404,
        message: 'Producto 999 no encontrado'
      });
    });

    it('should throw error for invalid quantity', async () => {
      const checkoutData = {
        userId: 1,
        products: [
          { id: 1, quantity: 0 }
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
        message: 'Cantidad o precio inválido para Test Product'
      });
    });

    it('should throw error for invalid price', async () => {
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
        price: 'invalid',
        stock: 10
      };

      mockCheckoutRepository.getProductById.mockResolvedValue(mockProduct as any);

      await expect(checkoutService.processCheckout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'Cantidad o precio inválido para Test Product'
      });
    });
  });
});