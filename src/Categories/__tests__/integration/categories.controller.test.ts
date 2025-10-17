// src/categories/__tests__/integration/categories.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createCategory, getCategories, updateCategory, setCategoriesService } from '../../infraestructure/controllers/categories.controllers';
import { CategoriesService } from '../../application/categories.service';

jest.mock('../../application/categories.service');
const MockedCategoriesService = CategoriesService as jest.MockedClass<typeof CategoriesService>;

describe('Categories Controller Integration Tests', () => {
  let app: express.Application;
  let mockCategoriesService: jest.Mocked<CategoriesService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockCategoriesService = {
      createCategory: jest.fn(),
      getAllCategories: jest.fn(),
      getCategoryById: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn()
    } as any;

  MockedCategoriesService.mockImplementation(() => mockCategoriesService);
  // Inyectar la instancia mock en el controlador
  setCategoriesService(mockCategoriesService);

    app.post('/admin/categories', createCategory);
    app.get('/categories', getCategories);
    app.put('/admin/categories/:category_id', updateCategory);
  });

  describe('POST /admin/categories', () => {
    it('should create category successfully', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description',
        is_active: 1
      };

      const expectedCategory = {
        id: 1,
        ...categoryData
      };

      mockCategoriesService.createCategory.mockResolvedValue(expectedCategory as any);

      const response = await request(app)
        .post('/admin/categories')
        .send(categoryData)
        .expect(201);

      expect(response.body.message).toBe('Categoría creada con éxito');
      expect(response.body.category.id).toBe(1);
    });

    it('should return error for duplicate category', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description'
      };

      mockCategoriesService.createCategory.mockRejectedValue({
        status: 409,
        message: 'Categoría ya existe'
      });

      const response = await request(app)
        .post('/admin/categories')
        .send(categoryData)
        .expect(409);

      expect(response.body.message).toBe('Categoría ya existe');
    });
  });

  describe('GET /categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Category 1',
          description: 'Description 1',
          is_active: 1
        },
        {
          id: 2,
          name: 'Category 2',
          description: 'Description 2',
          is_active: 1
        }
      ];

      mockCategoriesService.getAllCategories.mockResolvedValue(mockCategories as any);

      const response = await request(app)
        .get('/categories')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Category 1');
    });
  });
});