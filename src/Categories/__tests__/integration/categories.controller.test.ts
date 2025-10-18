import request from 'supertest';
import express from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory, setCategoriesService } from '../../infraestructure/controllers/categories.controllers';

describe('Categories Controller Integration Tests', () => {
  let app: express.Application;
  let mockCategoriesService: jest.Mocked<any>;

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

  // Inyectar el mock directamente en el controlador
  setCategoriesService(mockCategoriesService);

    app.post('/admin/categories', createCategory);
    app.get('/categories', getCategories);
    app.put('/admin/categories/:category_id', updateCategory);
    app.delete('/admin/categories/:category_id', deleteCategory);
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

    it('should return error for missing name', async () => {
      const invalidData = {
        description: 'Test Description'
      };

      // Simular fallo del servicio con datos inválidos
      mockCategoriesService.createCategory.mockRejectedValue({ status: 500, message: 'Nombre requerido' });

      const response = await request(app)
        .post('/admin/categories')
        .send(invalidData)
        .expect(500);

      expect(response.body.message).toBeDefined();
    });

    it('should handle default is_active value', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description'
      };

      const expectedCategory = {
        id: 1,
        ...categoryData,
        is_active: 1
      };

      mockCategoriesService.createCategory.mockResolvedValue(expectedCategory as any);

      const response = await request(app)
        .post('/admin/categories')
        .send(categoryData)
        .expect(201);

      expect(response.body.category.is_active).toBe(1);
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

    it('should return empty array when no categories exist', async () => {
      mockCategoriesService.getAllCategories.mockResolvedValue([]);

      const response = await request(app)
        .get('/categories')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PUT /admin/categories/:category_id', () => {
    it('should update category successfully', async () => {
      const categoryId = 1;
      const updateData = {
        name: 'Updated Category',
        description: 'Updated Description',
        is_active: 0
      };

      const updatedCategory = {
        id: categoryId,
        ...updateData
      };

      mockCategoriesService.updateCategory.mockResolvedValue(updatedCategory as any);

      const response = await request(app)
        .put(`/admin/categories/${categoryId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Categoría actualizada');
      expect(response.body.category.name).toBe('Updated Category');
    });

    it('should return error for invalid category id', async () => {
      const response = await request(app)
        .put('/admin/categories/invalid-id')
        .send({ name: 'Updated Category' })
        .expect(400);

      expect(response.body.message).toBe('ID inválido');
    });

    it('should return error for non-existent category', async () => {
      const categoryId = 999;
      const updateData = { name: 'Updated Category' };

      mockCategoriesService.updateCategory.mockRejectedValue({
        status: 404,
        message: 'Categoría no encontrada'
      });

      const response = await request(app)
        .put(`/admin/categories/${categoryId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Categoría no encontrada');
    });

    it('should return error for duplicate category name', async () => {
      const categoryId = 1;
      const updateData = { name: 'Existing Category Name' };

      mockCategoriesService.updateCategory.mockRejectedValue({
        status: 409,
        message: 'Nombre de categoría ya en uso'
      });

      const response = await request(app)
        .put(`/admin/categories/${categoryId}`)
        .send(updateData)
        .expect(409);

      expect(response.body.message).toBe('Nombre de categoría ya en uso');
    });

    it('should handle partial updates', async () => {
      const categoryId = 1;
      const updateData = {
        description: 'Updated description only'
      };

      const updatedCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Updated description only'
      };

      mockCategoriesService.updateCategory.mockResolvedValue(updatedCategory as any);

      const response = await request(app)
        .put(`/admin/categories/${categoryId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.category.description).toBe('Updated description only');
      expect(response.body.category.name).toBe('Test Category');
    });
  });

  describe('DELETE /admin/categories/:category_id', () => {
    it('should delete category successfully', async () => {
      const categoryId = 1;

      mockCategoriesService.deleteCategory.mockResolvedValue();

      const response = await request(app)
        .delete(`/admin/categories/${categoryId}`)
        .expect(200);

      expect(response.body.message).toBe('Categoría eliminada');
    });

    it('should return error for invalid category id', async () => {
      const response = await request(app)
        .delete('/admin/categories/invalid-id')
        .expect(400);

      expect(response.body.message).toBe('ID inválido');
    });

    it('should return error for non-existent category', async () => {
      const categoryId = 999;

      mockCategoriesService.deleteCategory.mockRejectedValue({
        status: 404,
        message: 'Categoría no encontrada'
      });

      const response = await request(app)
        .delete(`/admin/categories/${categoryId}`)
        .expect(404);

      expect(response.body.message).toBe('Categoría no encontrada');
    });
  });
});