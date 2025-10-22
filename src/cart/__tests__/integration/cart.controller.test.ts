// src/cart/__tests__/integration/cart.controller.test.ts
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

  // Inyectar mocks en el controlador
  setCartService(mockCartService);
  setProductsRepository(mockProductsRepository);

    cartController = new CartController();

    app.get('/cart', (req, res) => cartController.viewCart(req, res));
    app.post('/cart/items', (req, res) => cartController.addItem(req, res));
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
  });
});