// src/Products/__tests__/integration/products.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createProduct, getProducts, getProductById, setProductsService } from '../../infraestructure/controllers/products.controller';
import { ProductsService } from '../../application/products.service';

jest.mock('../../application/products.service');
const MockedProductsService = ProductsService as jest.MockedClass<typeof ProductsService>;

describe('Products Controller Integration Tests', () => {
  let app: express.Application;
  let mockProductsService: jest.Mocked<ProductsService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockProductsService = {
      createProduct: jest.fn(),
      getAllProducts: jest.fn(),
      getProductById: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      getProductsByCategory: jest.fn()
    } as any;

  MockedProductsService.mockImplementation(() => mockProductsService);
  // Inyectar la instancia mock en el controlador
  setProductsService(mockProductsService);

    app.post('/admin/products', createProduct);
    app.get('/products', getProducts);
    app.get('/products/:id', getProductById);
  });

  describe('POST /admin/products', () => {
    it('should create a product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        sku: 12345,
        category_id: 1,
        is_active: '1'
      };

      mockProductsService.createProduct.mockResolvedValue({
        id: 1,
        ...productData
      } as any);

      const response = await request(app)
        .post('/admin/products')
        .send(productData)
        .expect(201);

      expect(response.body.message).toBe('Producto agregado con éxito');
      expect(response.body.product.id).toBe(1);
    });

    it('should return error for duplicate product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        sku: 12345,
        category_id: 1,
        is_active: '1'
      };

      mockProductsService.createProduct.mockRejectedValue({
        status: 409,
        message: 'Producto ya existe'
      });

      const response = await request(app)
        .post('/admin/products')
        .send(productData)
        .expect(409);

      expect(response.body.message).toBe('Producto ya existe');
    });
  });

  describe('GET /products', () => {
    it('should return all active products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 99.99,
          stock: 10,
          is_active: '1',
          image_url: 'image1.jpg'
        },
        {
          id: 2,
          name: 'Product 2',
          price: 149.99,
          stock: 5,
          is_active: '1',
          image_url: 'image2.jpg'
        }
      ];

      mockProductsService.getAllProducts.mockResolvedValue(mockProducts as any);

      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].price_formatted).toBe('$99.99');
    });
  });
});