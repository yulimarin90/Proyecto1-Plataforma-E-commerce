import { CartService } from '../../application/cart.service';
import { ICartRepository } from '../../infraestructure/repositories/cart.repository';
import { Cart, CartItem } from '../../domain/cart.entity';

const createMockCartRepository = (): jest.Mocked<ICartRepository> => ({
  findByUser: jest.fn(),
  save: jest.fn(),
  deleteCart: jest.fn(),
  clearItems: jest.fn(),
  upsertItem: jest.fn(),
  removeItem: jest.fn()
});

describe('CartService', () => {
  let cartService: CartService;
  let mockRepository: jest.Mocked<ICartRepository>;

  beforeEach(() => {
    mockRepository = createMockCartRepository();
    cartService = new CartService(mockRepository);
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

      mockRepository.findByUser.mockResolvedValue(mockCart);

      const result = await cartService.getCart(userId);

      expect(mockRepository.findByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCart);
    });

    it('should create new cart if none exists', async () => {
      const userId = 1;
      mockRepository.findByUser.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue();

      const result = await cartService.getCart(userId);

      expect(mockRepository.findByUser).toHaveBeenCalledWith(userId);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.user_id).toBe(userId);
      expect(result.status).toBe('active');
    });

    it('should throw error if cart has expired', async () => {
      const userId = 1;
      const expiredCart: Cart = {
        id: 1,
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(expiredCart);

      await expect(cartService.getCart(userId)).rejects.toThrow('El carrito ha expirado por inactividad');
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

      mockRepository.findByUser.mockResolvedValue(mockCart);
      mockRepository.save.mockResolvedValue();

  const result = await cartService.addItem(userId, productData);

  expect(mockRepository.save).toHaveBeenCalled();
  expect(result.items).toHaveLength(1);
  const items = result.items as CartItem[];
  // Asegurar que hay al menos un item antes de acceder por índice
  expect(items).toHaveLength(1);
  const itemsArr = items as CartItem[];
  expect(itemsArr[0]!.product_id).toBe(productData.product_id);
    });

    it('should update quantity if item already exists in cart', async () => {
      const userId = 1;
      const productData = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10
      };

      const existingItem: CartItem = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 1,
        stock_available: 10,
        added_at: new Date(),
        price_locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
        subtotal: 99.99
      };

      const mockCart: Cart = {
        id: 1,
        user_id: userId,
        items: [existingItem],
        total_amount: 99.99,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(mockCart);
      mockRepository.save.mockResolvedValue();

    const result = await cartService.addItem(userId, productData);

  const resCart1 = result as Cart;
  const items1 = resCart1.items as CartItem[];
  // Asegurar que hay al menos un item antes de acceder por índice
  expect(items1).toHaveLength(1);
  const items1Arr = items1 as CartItem[];
  expect(items1Arr[0]!.quantity).toBe(3); // 1 + 2
  // usar toBeCloseTo por posibles imprecisiones de coma flotante
  expect(items1Arr[0]!.subtotal).toBeCloseTo(299.97, 2); // 99.99 * 3
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

    it('should throw error for insufficient stock', async () => {
      const userId = 1;
      const productData = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 20,
        stock_available: 10
      };

      await expect(cartService.addItem(userId, productData)).rejects.toThrow('Cantidad supera el stock disponible');
    });

    it('should throw error for invalid quantity', async () => {
      const userId = 1;
      const productData = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 0,
        stock_available: 10
      };

      await expect(cartService.addItem(userId, productData)).rejects.toThrow('La cantidad debe ser mayor a 0');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity successfully', async () => {
      const userId = 1;
      const productId = 1;
      const newQuantity = 5;
      const currentStock = 10;

      const existingItem: CartItem = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10,
        added_at: new Date(),
        price_locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
        subtotal: 199.98
      };

      const mockCart: Cart = {
        id: 1,
        user_id: userId,
        items: [existingItem],
        total_amount: 199.98,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(mockCart);
      mockRepository.save.mockResolvedValue();

  const result = await cartService.updateQuantity(userId, productId, newQuantity, currentStock);

  const resCart2 = result as Cart;
  const items2 = resCart2.items as CartItem[];
  // Asegurar que hay al menos un item antes de acceder por índice
  expect(items2).toHaveLength(1);
  const items2Arr = items2 as CartItem[];
  expect(items2Arr[0]!.quantity).toBe(newQuantity);
  expect(items2Arr[0]!.subtotal).toBeCloseTo(499.95, 2); // 99.99 * 5
    });

    it('should throw error if product not found in cart', async () => {
      const userId = 1;
      const productId = 999;
      const newQuantity = 5;
      const currentStock = 10;

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

      mockRepository.findByUser.mockResolvedValue(mockCart);

      await expect(cartService.updateQuantity(userId, productId, newQuantity, currentStock)).rejects.toThrow('Producto no encontrado en el carrito');
    });

    it('should throw error for invalid quantity', async () => {
      const userId = 1;
      const productId = 1;
      const newQuantity = 0;
      const currentStock = 10;

      // Asegurar que el carrito contiene el producto para que la validación de cantidad se evalúe
      const existingItemForInvalid: CartItem = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10,
        added_at: new Date(),
        price_locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
        subtotal: 199.98
      };

      const mockCartForInvalid: Cart = {
        id: 1,
        user_id: userId,
        items: [existingItemForInvalid],
        total_amount: 199.98,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(mockCartForInvalid);

      await expect(cartService.updateQuantity(userId, productId, newQuantity, currentStock)).rejects.toThrow('Cantidad inválida');
    });

    it('should throw error for insufficient stock', async () => {
      const userId = 1;
      const productId = 1;
      const newQuantity = 20;
      const currentStock = 10;

      // Asegurar que el carrito contiene el producto para que la validación de stock se evalúe
      const existingItemForStock: CartItem = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10,
        added_at: new Date(),
        price_locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
        subtotal: 199.98
      };

      const mockCartForStock: Cart = {
        id: 1,
        user_id: userId,
        items: [existingItemForStock],
        total_amount: 199.98,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(mockCartForStock);

      await expect(cartService.updateQuantity(userId, productId, newQuantity, currentStock)).rejects.toThrow('Cantidad supera el stock disponible');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart successfully', async () => {
      const userId = 1;
      const productId = 1;

      const existingItem: CartItem = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10,
        added_at: new Date(),
        price_locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
        subtotal: 199.98
      };

      const mockCart: Cart = {
        id: 1,
        user_id: userId,
        items: [existingItem],
        total_amount: 199.98,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(mockCart);
      mockRepository.save.mockResolvedValue();

      const result = await cartService.removeItem(userId, productId);

      expect(result.items).toHaveLength(0);
      expect(result.total_amount).toBe(0);
    });

    it('should handle removing non-existent item gracefully', async () => {
      const userId = 1;
      const productId = 999;

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

      mockRepository.findByUser.mockResolvedValue(mockCart);
      mockRepository.save.mockResolvedValue();

      const result = await cartService.removeItem(userId, productId);

      expect(result.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart successfully', async () => {
      const userId = 1;

      const existingItem: CartItem = {
        product_id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        stock_available: 10,
        added_at: new Date(),
        price_locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
        subtotal: 199.98
      };

      const mockCart: Cart = {
        id: 1,
        user_id: userId,
        items: [existingItem],
        total_amount: 199.98,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active'
      };

      mockRepository.findByUser.mockResolvedValue(mockCart);
      mockRepository.save.mockResolvedValue();

      await cartService.clearCart(userId);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});