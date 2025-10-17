import request from 'supertest';
import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getProductsByCategory, setProductsService } from '../../infraestructure/controllers/products.controller';

describe('Products Controller Integration Tests', () => {
  let app: express.Application;
  let mockProductsService: jest.Mocked<any>;

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

  // Inyectar mock directamente en el controlador
  setProductsService(mockProductsService);

    app.post('/admin/products', createProduct);
    app.get('/products', getProducts);
    app.get('/products/:id', getProductById);
    app.put('/admin/products/:product_id', updateProduct);
    app.delete('/admin/products/:product_id', deleteProduct);
    app.get('/categories/:id', getProductsByCategory);
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

    it('should return error for invalid data', async () => {
      const invalidData = {
        name: '',
        price: 'invalid'
      };

      // Simular que el servicio falla con datos inválidos
      mockProductsService.createProduct.mockRejectedValue({ status: 500, message: 'Datos inválidos' });

      const response = await request(app)
        .post('/admin/products')
        .send(invalidData)
        .expect(500);

      expect(response.body.message).toBeDefined();
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

    it('should filter out inactive products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Active Product',
          price: 99.99,
          stock: 10,
          is_active: '1',
          image_url: 'image1.jpg'
        },
        {
          id: 2,
          name: 'Inactive Product',
          price: 149.99,
          stock: 0,
          is_active: '0',
          image_url: 'image2.jpg'
        }
      ];

      mockProductsService.getAllProducts.mockResolvedValue(mockProducts as any);

      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Active Product');
    });
  });

  describe('GET /products/:id', () => {
    it('should return product by id', async () => {
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        is_active: '1',
        image_url: 'image1.jpg',
        is_discontinued: 0
      };

      mockProductsService.getProductById.mockResolvedValue(mockProduct as any);

      const response = await request(app)
        .get(`/products/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body.price_formatted).toBe('$99.99');
    });

    it('should return error for invalid product id', async () => {
      const response = await request(app)
        .get('/products/invalid-id')
        .expect(400);

      expect(response.body.message).toBe('ID de producto inválido o faltante');
    });

    it('should return error for non-existent product', async () => {
      const productId = 999;

      mockProductsService.getProductById.mockRejectedValue({
        status: 404,
        message: 'Producto no encontrado'
      });

      const response = await request(app)
        .get(`/products/${productId}`)
        .expect(404);

      expect(response.body.message).toBe('Producto no encontrado');
    });
  });

  describe('PUT /admin/products/:product_id', () => {
    it('should update product successfully', async () => {
      const productId = 1;
      const updateData = {
        name: 'Updated Product',
        price: 149.99,
        description: 'Updated Description'
      };

      const updatedProduct = {
        id: productId,
        ...updateData
      };

      mockProductsService.updateProduct.mockResolvedValue(updatedProduct as any);

      const response = await request(app)
        .put(`/admin/products/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Producto actualizado con éxito');
      expect(response.body.product.name).toBe('Updated Product');
    });

    it('should return error for invalid product id', async () => {
      const response = await request(app)
        .put('/admin/products/invalid-id')
        .send({ name: 'Updated Product' })
        .expect(400);

      expect(response.body.message).toBe('ID de producto inválido o faltante');
    });

    it('should return error for non-existent product', async () => {
      const productId = 999;
      const updateData = { name: 'Updated Product' };

      mockProductsService.updateProduct.mockRejectedValue({
        status: 404,
        message: 'Producto no encontrado'
      });

      const response = await request(app)
        .put(`/admin/products/${productId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Producto no encontrado');
    });
  });

  describe('DELETE /admin/products/:product_id', () => {
    it('should delete product successfully', async () => {
      const productId = 1;

      mockProductsService.deleteProduct.mockResolvedValue();

      const response = await request(app)
        .delete(`/admin/products/${productId}`)
        .expect(200);

      expect(response.body.message).toBe('Producto eliminado correctamente');
    });

    it('should return error for invalid product id', async () => {
      const response = await request(app)
        .delete('/admin/products/invalid-id')
        .expect(400);

      expect(response.body.message).toBe('ID de producto inválido o faltante');
    });

    it('should return error for non-existent product', async () => {
      const productId = 999;

      mockProductsService.deleteProduct.mockRejectedValue({
        status: 404,
        message: 'Producto no encontrado'
      });

      const response = await request(app)
        .delete(`/admin/products/${productId}`)
        .expect(404);

      expect(response.body.message).toBe('Producto no encontrado');
    });
  });

  describe('GET /categories/:id', () => {
    it('should return products by category', async () => {
      const categoryId = 1;
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 99.99,
          stock: 10,
          is_active: '1',
          image_url: 'image1.jpg',
          is_discontinued: 0
        },
        {
          id: 2,
          name: 'Product 2',
          price: 149.99,
          stock: 5,
          is_active: '1',
          image_url: 'image2.jpg',
          is_discontinued: 0
        }
      ];

      mockProductsService.getProductsByCategory.mockResolvedValue(mockProducts as any);

      const response = await request(app)
        .get(`/categories/${categoryId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].price_formatted).toBe('$99.99');
    });

    it('should return error for invalid category id', async () => {
      const response = await request(app)
        .get('/categories/invalid-id')
        .expect(400);

      expect(response.body.message).toBe('ID de categoría inválido o faltante');
    });

    it('should filter out discontinued products', async () => {
      const categoryId = 1;
      const mockProducts = [
        {
          id: 1,
          name: 'Active Product',
          price: 99.99,
          stock: 10,
          is_active: '1',
          image_url: 'image1.jpg',
          is_discontinued: 0
        },
        {
          id: 2,
          name: 'Discontinued Product',
          price: 149.99,
          stock: 5,
          is_active: '1',
          image_url: 'image2.jpg',
          is_discontinued: 1
        }
      ];

      mockProductsService.getProductsByCategory.mockResolvedValue(mockProducts as any);

      const response = await request(app)
        .get(`/categories/${categoryId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Active Product');
    });
  });
});