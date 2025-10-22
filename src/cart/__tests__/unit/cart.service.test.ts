// src/cart/__tests__/unit/cart.service.test.ts
import { CartService } from '../../application/cart.service';
import { ICartRepository } from '../../infraestructure/repositories/cart.repository';
import { Cart, CartItem } from '../../domain/cart.entity';

const mockCartRepository: jest.Mocked<ICartRepository> = {
  findByUser: jest.fn(),
  save: jest.fn(),
  deleteCart: jest.fn(),
  clearItems: jest.fn(),
  upsertItem: jest.fn(),
  removeItem: jest.fn()
};

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    cartService = new CartService(mockCartRepository);
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return existing cart', async () => {
      const userId = 1;
      const mockCart: Cart = {
        id: 1,
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockCartRepository.findByUser.mockResolvedValue(mockCart);

      const result = await cartService.getCart(userId);

      expect(mockCartRepository.findByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCart);
    });

    it('should create new cart if none exists', async () => {
      const userId = 1;
      mockCartRepository.findByUser.mockResolvedValue(null);
      mockCartRepository.save.mockResolvedValue();

      const result = await cartService.getCart(userId);

      expect(mockCartRepository.findByUser).toHaveBeenCalledWith(userId);
      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(result.user_id).toBe(userId);
      expect(result.status).toBe('active');
    });
  });

  describe('addItem', () => {
    it('should add item to cart successfully', async () => {
      const userId = 1;
      const productData = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10
      };

      const mockCart: Cart = {
        id: 1,
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockCartRepository.findByUser.mockResolvedValue(mockCart);
      mockCartRepository.save.mockResolvedValue();

      const result = await cartService.addItem(userId, productData);

      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(result.items).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items![0]!.product_id).toBe(productData.product_id);

    });

    it('should throw error for invalid product data', async () => {
      const userId = 1;
      const invalidProductData = {
        product_id: null,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10
      };

  await expect(cartService.addItem(userId, invalidProductData as any)).rejects.toThrow('El ID del producto no es válido');
    });
  });
});
