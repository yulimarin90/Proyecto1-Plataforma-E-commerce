// src/Products/__tests__/integration/products.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, setProductsService, getProductsByCategory, getProductCatalog } from '../../Products/infraestructure/controllers/products.controller';
import { ProductsService } from '../../Products/application/products.service';

jest.mock('../../Products/application/products.service');
const MockedProductsService = ProductsService as jest.MockedClass<typeof ProductsService>;

describe('Products Controller Integration (compact)', () => {
  let app: express.Application;
  let svc: jest.Mocked<ProductsService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    svc = { createProduct: jest.fn(), getAllProducts: jest.fn(), getProductById: jest.fn(), updateProduct: jest.fn(), deleteProduct: jest.fn(), getProductsByCategory: jest.fn(), getFilteredProducts: jest.fn() } as any;
    MockedProductsService.mockImplementation(() => svc);
    setProductsService(svc);
    app.post('/admin/products', createProduct);
    // ruta auxiliar para probar req.file
    app.post('/admin/products/upload', (req: any, _res, next) => { req.file = { path: 'file.jpg' }; next(); }, createProduct);
    app.get('/products', getProducts);
    app.get('/products/catalog', getProductCatalog);
    app.get('/products/category/:id', getProductsByCategory);
    app.get('/products/:id', getProductById);
    app.put('/admin/products/:id', updateProduct);
    app.delete('/admin/products/:id', deleteProduct);
  });

  afterEach(() => jest.clearAllMocks());

  it('POST /admin/products convierte is_active a número', async () => {
    const payload = { name: 'P', price: 10, stock: 1, category_id: 1, is_active: true };
    svc.createProduct.mockResolvedValue({ id: 1, ...payload, is_active: 1 } as any);
    const r = await request(app).post('/admin/products').send(payload).expect(201);
    expect(r.body.product.is_active).toBe(1);
  });
  it('POST con req.file asigna image_url', async () => {
    const payload = { name: 'P', price: 10, stock: 1, category_id: 1 } as any;
    svc.createProduct.mockResolvedValue({ id: 2, ...payload, image_url: 'file.jpg', is_active: 1, is_discontinued: 0 } as any);
    const r = await request(app).post('/admin/products/upload').send(payload).expect(201);
    expect(r.body.product.image_url).toBe('file.jpg');
  });

  it('GET /products filtra inactivos/stock 0/sin imagen', async () => {
    svc.getAllProducts.mockResolvedValue([
      { id: 1, name: 'A', price: 10, stock: 1, is_active: '1', image_url: 'x' },
      { id: 2, name: 'B', price: 10, stock: 0, is_active: '1', image_url: 'x' },
      { id: 3, name: 'C', price: 10, stock: 1, is_active: '0', image_url: 'x' },
      { id: 4, name: 'D', price: 10, stock: 1, is_active: '1', image_url: '' },
    ] as any);
    const r = await request(app).get('/products').expect(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].name).toBe('A');
  });

  describe('GET /products/:id', () => {
    it('happy path', async () => {
      svc.getProductById.mockResolvedValue({ id: 1, name: 'P', price: 10, stock: 1, is_active: '1', image_url: 'x', is_discontinued: 0 } as any);
      const r = await request(app).get('/products/1').expect(200);
      expect(r.body.name).toBe('P');
    });
    it('id inválido', async () => {
      await request(app).get('/products/invalid').expect(400);
    });
    it.each([
      [{ is_active: '0' }],
      [{ stock: 0 }],
      [{ image_url: '' }],
      [{ is_discontinued: 1 }],
    ])('404 por no disponible (%o)', async (over) => {
      const base: any = { id: 1, name: 'P', price: 10, stock: 1, is_active: '1', image_url: 'x', is_discontinued: 0 };
      svc.getProductById.mockResolvedValue({ ...base, ...over });
      await request(app).get('/products/1').expect(404);
    });
    it('error del servicio', async () => {
      svc.getProductById.mockRejectedValue(new Error('Database error'));
      const r = await request(app).get('/products/2').expect(500);
      expect(r.body.message).toBe('Database error');
    });
  });

  describe('PUT y DELETE admin', () => {
    it('PUT inválido y conversión flags', async () => {
      await request(app).put('/admin/products/invalid').send({}).expect(400);
      svc.updateProduct.mockResolvedValue({ id: 1, is_active: 1, is_discontinued: 0 } as any);
      const r = await request(app).put('/admin/products/1').send({ is_active: true, is_discontinued: false }).expect(200);
      expect(r.body.product.is_active).toBe(1);
      expect(r.body.product.is_discontinued).toBe(0);
    });
    it('PUT error y DELETE ok/error', async () => {
      svc.updateProduct.mockRejectedValue(new Error('Database error'));
      await request(app).put('/admin/products/1').send({ name: 'X' }).expect(500);
      svc.deleteProduct.mockResolvedValue();
      await request(app).delete('/admin/products/1').expect(200);
      // delete invalid id
      await request(app).delete('/admin/products/invalid').expect(400);
      svc.deleteProduct.mockRejectedValue(new Error('Database error'));
      await request(app).delete('/admin/products/1').expect(500);
    });
  });

  describe('Por categoría y catálogo', () => {
    it('GET /products/category/:id filtra y formatea', async () => {
      svc.getProductsByCategory.mockResolvedValue([
        { id: 1, name: 'A', price: 10, stock: 1, is_active: '1', image_url: 'x', is_discontinued: 0 },
        { id: 2, name: 'B', price: 10, stock: 0, is_active: '1', image_url: 'x', is_discontinued: 0 },
      ] as any);
      const r = await request(app).get('/products/category/5').expect(200);
      expect(r.body).toHaveLength(1);
      expect(r.body[0].price_formatted).toBe('$10.00');
    });
    it('GET /products/category error y catálogo ok/error', async () => {
      svc.getProductsByCategory.mockRejectedValue(new Error('Database error'));
      await request(app).get('/products/category/1').expect(500);
      await request(app).get('/products/category/invalid').expect(400);
      (svc as any).getFilteredProducts = jest.fn().mockResolvedValue({ products: [{ id: 1, name: 'A', price: 10 }], total: 1 });
      const ok = await request(app).get('/products/catalog?page=1&limit=12').expect(200);
      expect(ok.body.pagination.total).toBe(1);
      ;(svc as any).getFilteredProducts = jest.fn().mockRejectedValue(new Error('Database error'));
      await request(app).get('/products/catalog?page=1').expect(500);
    });
  });
});