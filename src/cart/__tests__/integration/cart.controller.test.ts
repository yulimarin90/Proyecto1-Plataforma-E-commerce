import request from 'supertest';
import express from 'express';
import { CartController, setCartService, setProductsRepository } from '../../infraestructure/controllers/cart.controller';
import { CartService } from '../../application/cart.service';
import { ProductsRepository } from '../../../Products/infraestructure/repositories/products.repository';

jest.mock('../../application/cart.service');
jest.mock('../../../Products/infraestructure/repositories/products.repository');

const MockedCartService = CartService as jest.MockedClass<typeof CartService>;
const MockedProductsRepository = ProductsRepository as jest.MockedClass<typeof ProductsRepository>;

describe('Cart Controller Integration Tests', () => {
  let app: express.Application;
  let mockCartService: jest.Mocked<CartService>;
  let mockProductsRepository: jest.Mocked<ProductsRepository>;
  let cartController: CartController;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockCartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn()
    } as any;

    mockProductsRepository = {
      findById: jest.fn()
    } as any;

    MockedCartService.mockImplementation(() => mockCartService);
    MockedProductsRepository.mockImplementation(() => mockProductsRepository);

    cartController = new CartController();

  // Inyectar mocks en el controlador para que use estas implementaciones durante las pruebas
  setCartService(mockCartService as any);
  setProductsRepository(mockProductsRepository as any);

    app.get('/cart', (req, res) => cartController.viewCart(req, res));
    app.post('/cart/items', (req, res) => cartController.addItem(req, res));
    app.patch('/cart/items/:item_id', (req, res) => cartController.updateQuantity(req, res));
    app.delete('/cart/items/:productId', (req, res) => cartController.removeItem(req, res));
    app.delete('/cart/clear', (req, res) => cartController.clearCart(req, res));
  });

  describe('GET /cart', () => {
    it('should return user cart', async () => {
      const userId = 1;
      const mockCart = {
        id: 1,
        user_id: userId,
        items: [
          {
            product_id: 1,
            name: 'Test Product',
            price: 99.99,
            quantity: 2,
            subtotal: 199.98
          }
        ],
        total_amount: 199.98
      };

      mockCartService.getCart.mockResolvedValue(mockCart as any);

      const response = await request(app)
        .get('/cart')
        .set('x-user-id', userId.toString())
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.total_amount).toBe(199.98);
    });

    it('should return error for unauthorized user', async () => {
      const response = await request(app)
        .get('/cart')
        .expect(401);

      expect(response.body.error).toBe('Usuario no autenticado');
    });

    it('should return error for expired cart', async () => {
      const userId = 1;

      mockCartService.getCart.mockRejectedValue(new Error('El carrito ha expirado por inactividad'));

      const response = await request(app)
        .get('/cart')
        .set('x-user-id', userId.toString())
        .expect(401);

      expect(response.body.error).toBe('El carrito ha expirado por inactividad');
    });
  });

  describe('POST /cart/items', () => {
    it('should add item to cart', async () => {
      const userId = 1;
      const itemData = {
        productId: 1,
        cantidad: 2
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };

      const mockCart = {
        id: 1,
        user_id: userId,
        items: [
          {
            product_id: 1,
            name: 'Test Product',
            price: 99.99,
            quantity: 2,
            subtotal: 199.98
          }
        ],
        total_amount: 199.98
      };

      mockProductsRepository.findById.mockResolvedValue(mockProduct as any);
      mockCartService.addItem.mockResolvedValue(mockCart as any);

      const response = await request(app)
        .post('/cart/items')
        .send({ ...itemData, user_id: userId })
        .expect(201);

      expect(response.body.message).toBe('Producto agregado');
      expect(response.body.cart.items).toHaveLength(1);
    });

    it('should return error for insufficient stock', async () => {
      const userId = 1;
      const itemData = {
        productId: 1,
        cantidad: 20
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };

      mockProductsRepository.findById.mockResolvedValue(mockProduct as any);

      const response = await request(app)
        .post('/cart/items')
        .send({ ...itemData, user_id: userId })
        .expect(400);

      expect(response.body.error).toBe('Cantidad supera el stock disponible');
    });

    it('should return error for missing product data', async () => {
      const response = await request(app)
        .post('/cart/items')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('productId y cantidad son requeridos');
    });

    it('should return error for non-existent product', async () => {
      const userId = 1;
      const itemData = {
        productId: 999,
        cantidad: 2
      };

      mockProductsRepository.findById.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/cart/items')
        .send({ ...itemData, user_id: userId })
        .expect(404);

      expect(response.body.error).toBe('Producto no encontrado');
    });

    it('should return error for invalid quantity', async () => {
      const userId = 1;
      const itemData = {
        productId: 1,
        cantidad: 0
      };

      const response = await request(app)
        .post('/cart/items')
        .send({ ...itemData, user_id: userId })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /cart/items/:item_id', () => {
    it('should update item quantity successfully', async () => {
      const userId = 1;
      const itemId = 1;
      const updateData = {
        quantity: 5
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };

      const mockCart = {
        id: 1,
        user_id: userId,
        items: [
          {
            product_id: 1,
            name: 'Test Product',
            price: 99.99,
            quantity: 5,
            subtotal: 499.95
          }
        ],
        total_amount: 499.95
      };

      mockProductsRepository.findById.mockResolvedValue(mockProduct as any);
      mockCartService.updateQuantity.mockResolvedValue(mockCart as any);

      const response = await request(app)
        .patch(`/cart/items/${itemId}`)
        .send(updateData)
        .set('x-user-id', userId.toString())
        .expect(200);

      expect(response.body.message).toBe('Cantidad actualizada');
      expect(response.body.cart.items[0].quantity).toBe(5);
    });

    it('should return error for non-existent product', async () => {
      const userId = 1;
      const itemId = 999;
      const updateData = {
        quantity: 5
      };

      mockProductsRepository.findById.mockResolvedValue(undefined);

      const response = await request(app)
        .patch(`/cart/items/${itemId}`)
        .send(updateData)
        .set('x-user-id', userId.toString())
        .expect(404);

      expect(response.body.message).toBe('Producto no encontrado');
    });

    it('should return error for invalid quantity', async () => {
      const userId = 1;
      const itemId = 1;
      const updateData = {
        quantity: 0
      };

      // Mockear existencia del producto y hacer que el servicio rechace por cantidad inválida
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };

      mockProductsRepository.findById.mockResolvedValue(mockProduct as any);
      mockCartService.updateQuantity.mockRejectedValue(new Error('Cantidad inválida'));

      const response = await request(app)
        .patch(`/cart/items/${itemId}`)
        .send(updateData)
        .set('x-user-id', userId.toString())
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /cart/items/:productId', () => {
    it('should remove item from cart successfully', async () => {
      const userId = 1;
      const productId = 1;

      const mockCart = {
        id: 1,
        user_id: userId,
        items: [],
        total_amount: 0
      };

      mockCartService.removeItem.mockResolvedValue(mockCart as any);

      const response = await request(app)
        .delete(`/cart/items/${productId}`)
        .set('x-user-id', userId.toString())
        .expect(200);

      expect(response.body.message).toBe('Ítem eliminado');
      expect(response.body.cart.items).toHaveLength(0);
    });

    it('should return error for missing productId', async () => {
      const userId = 1;

      const response = await request(app)
        .delete('/cart/items/')
        .set('x-user-id', userId.toString())
        .expect(404);
    });
  });

  describe('DELETE /cart/clear', () => {
    it('should clear cart successfully', async () => {
      const userId = 1;

      mockCartService.clearCart.mockResolvedValue();

      const response = await request(app)
        .delete('/cart/clear')
        .set('x-user-id', userId.toString())
        .expect(204);

      expect(response.status).toBe(204);
    });

    it('should return error for unauthorized user', async () => {
      const response = await request(app)
        .delete('/cart/clear')
        .expect(401);

      expect(response.body.error).toBe('Usuario no autenticado');
    });
  });
});