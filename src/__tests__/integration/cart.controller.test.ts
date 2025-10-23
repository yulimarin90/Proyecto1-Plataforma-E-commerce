// src/cart/__tests__/integration/cart.controller.test.ts (compact)
import request from 'supertest';
import express from 'express';
import { CartController, setCartService, setProductsRepository } from '../../cart/infraestructure/controllers/cart.controller';
import { CartService } from '../../cart/application/cart.service';
import { ProductsRepository } from '../../Products/infraestructure/repositories/products.repository';

jest.mock('../../cart/application/cart.service');
jest.mock('../../Products/infraestructure/repositories/products.repository');
const MockSvc = CartService as jest.MockedClass<typeof CartService>;
const MockRepo = ProductsRepository as jest.MockedClass<typeof ProductsRepository>;

describe('Cart Controller Integration (compact)', () => {
  let app: express.Application;
  let svc: jest.Mocked<CartService>;
  let repo: jest.Mocked<ProductsRepository>;

  const mkCart = (user = 1, qty = 2) => ({ id: 1, user_id: user, items: [{ product_id: 1, name: 'P', price: 10, quantity: qty, subtotal: 10 * qty }], total_amount: 10 * qty });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    svc = { getCart: jest.fn(), addItem: jest.fn(), updateQuantity: jest.fn(), removeItem: jest.fn(), clearCart: jest.fn(), checkout: jest.fn() } as any;
    repo = { findById: jest.fn() } as any;
    MockSvc.mockImplementation(() => svc);
    MockRepo.mockImplementation(() => repo);
    setCartService(svc); setProductsRepository(repo);
    const c = new CartController();
    app.get('/cart', (req, res) => c.viewCart(req, res));
    app.post('/cart/items', (req, res) => c.addItem(req, res));
    app.patch('/cart/items/:productId', (req, res) => c.updateQuantity(req, res));
    app.delete('/cart/items/:productId', (req, res) => c.removeItem(req, res));
    app.delete('/cart/clear', (req, res) => c.clearCart(req, res));
    app.post('/cart/checkout', (req, res) => c.checkout(req, res));
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /cart 401 si no autenticado y 200 si ok', async () => {
    await request(app).get('/cart').expect(401);
    const cart = mkCart(); svc.getCart.mockResolvedValue(cart as any);
    const r = await request(app).get('/cart').set('x-user-id', '1').expect(200);
    expect(r.body.total_amount).toBe(cart.total_amount);
  });

  describe('POST /cart/items', () => {
    it('agrega item y errores de validación', async () => {
      repo.findById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 10, is_active: 1, is_discontinued: 0 } as any);
      svc.getCart.mockResolvedValue(mkCart() as any); svc.addItem.mockResolvedValue(mkCart() as any);
      await request(app).post('/cart/items').set('x-user-id', '1').send({ productId: 1, quantity: 2 }).expect(201);
      repo.findById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 1, is_active: 1, is_discontinued: 0 } as any);
      await request(app).post('/cart/items').set('x-user-id', '1').send({ productId: 1, quantity: 3 }).expect(400);
      repo.findById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 10, is_active: 0, is_discontinued: 0 } as any);
      await request(app).post('/cart/items').set('x-user-id', '1').send({ productId: 1, quantity: 1 }).expect(400);
      repo.findById.mockResolvedValue(undefined as any);
      await request(app).post('/cart/items').set('x-user-id', '1').send({ productId: 99, quantity: 1 }).expect(404);
    });
  });

  describe('PATCH /cart/items/:productId', () => {
    it('actualiza cantidad y valida stock', async () => {
      repo.findById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 10, is_active: 1, is_discontinued: 0 } as any);
      svc.updateQuantity.mockResolvedValue(mkCart(1, 3) as any);
      await request(app).patch('/cart/items/1').set('x-user-id', '1').send({ productId: 1, quantity: 3 }).expect(200);
      repo.findById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 1, is_active: 1, is_discontinued: 0 } as any);
      await request(app).patch('/cart/items/1').set('x-user-id', '1').send({ productId: 1, quantity: 3 }).expect(400);
      // error del servicio
      repo.findById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 10, is_active: 1, is_discontinued: 0 } as any);
      svc.updateQuantity.mockRejectedValue(new Error('Service error'));
      const err = await request(app).patch('/cart/items/1').set('x-user-id', '1').send({ productId: 1, quantity: 2 }).expect(400);
      expect(err.body.error).toBe('Service error');
    });
  });

  describe('DELETE /cart/items/:productId y /cart/clear', () => {
    it('elimina item ok/400 inválido y clear error', async () => {
      svc.removeItem.mockResolvedValue({ id: 1, user_id: 1, items: [], total_amount: 0 } as any);
      await request(app).delete('/cart/items/1').set('x-user-id', '1').expect(200);
      await request(app).delete('/cart/items/invalid').set('x-user-id', '1').expect(400);
      svc.clearCart.mockRejectedValue(new Error('El carrito ya está vacío'));
      await request(app).delete('/cart/clear').set('x-user-id', '1').expect(400);
      // error en removeItem
      svc.removeItem.mockRejectedValue(new Error('Service error'));
      const r = await request(app).delete('/cart/items/1').set('x-user-id', '1').expect(400);
      expect(r.body.error).toBe('Service error');
    });
  });

  describe('POST /cart/checkout', () => {
    it('success, vacío, expirado y sin stock', async () => {
      // éxito
      svc.getCart.mockResolvedValue(mkCart() as any); repo.findById.mockResolvedValue({ id: 1, name: 'P', stock: 10 } as any);
      svc.checkout.mockResolvedValue({ id: 1 } as any);
      await request(app).post('/cart/checkout').set('x-user-id', '1').send({ shipping_address: 'X', payment_method: 'Y' }).expect(201);
      // vacío
      svc.getCart.mockResolvedValue({ id: 1, user_id: 1, items: [], total_amount: 0 } as any);
      await request(app).post('/cart/checkout').set('x-user-id', '1').send({}).expect(400);
      // expirado
      svc.getCart.mockResolvedValue({ ...mkCart(), expires_at: new Date(Date.now() - 1000) } as any);
      await request(app).post('/cart/checkout').set('x-user-id', '1').send({}).expect(410);
      // sin stock
      svc.getCart.mockResolvedValue(mkCart(1, 5) as any); repo.findById.mockResolvedValue({ id: 1, name: 'P', stock: 1 } as any);
      await request(app).post('/cart/checkout').set('x-user-id', '1').send({}).expect(400);
      // error del servicio checkout
      svc.getCart.mockResolvedValue(mkCart() as any); repo.findById.mockResolvedValue({ id: 1, name: 'P', stock: 10 } as any);
      svc.checkout.mockRejectedValue(new Error('Checkout service error'));
      const ce = await request(app).post('/cart/checkout').set('x-user-id', '1').send({}).expect(400);
      expect(ce.body.error).toBe('Checkout service error');
    });
  });
});