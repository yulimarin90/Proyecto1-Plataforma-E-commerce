// src/categories/__tests__/integration/categories.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory, setCategoriesService } from '../../Categories/infraestructure/controllers/categories.controllers';
import { CategoriesService } from '../../Categories/application/categories.service';

jest.mock('../../Categories/application/categories.service');
const Mocked = CategoriesService as jest.MockedClass<typeof CategoriesService>;

describe('Categories Controller (compact)', () => {
  let app: express.Application;
  let svc: jest.Mocked<CategoriesService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    svc = { createCategory: jest.fn(), getAllCategories: jest.fn(), getCategoryById: jest.fn(), updateCategory: jest.fn(), deleteCategory: jest.fn() } as any;
    Mocked.mockImplementation(() => svc);
    setCategoriesService(svc);
    app.post('/admin/categories', createCategory);
    app.get('/categories', getCategories);
    app.put('/admin/categories/:category_id', updateCategory);
    app.delete('/admin/categories/:category_id', deleteCategory);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /admin/categories', () => {
    it('crea y convierte is_active', async () => {
      svc.createCategory.mockResolvedValue({ id: 1, name: 'C', description: 'D', is_active: 1 } as any);
      const r = await request(app).post('/admin/categories').send({ name: 'C', description: 'D', is_active: true }).expect(201);
      expect(r.body.category.is_active).toBe(1);
    });
    it('is_active default y errores', async () => {
      svc.createCategory.mockResolvedValue({ id: 1, name: 'C', description: 'D', is_active: 1 } as any);
      await request(app).post('/admin/categories').send({ name: 'C', description: 'D' }).expect(201);
      svc.createCategory.mockRejectedValue({ status: 409, message: 'Categoría ya existe' });
      await request(app).post('/admin/categories').send({ name: 'C' }).expect(409);
      svc.createCategory.mockRejectedValue(new Error('Database error'));
      await request(app).post('/admin/categories').send({ name: 'C' }).expect(500);
    });
  });

  describe('GET /categories', () => {
    it('lista y error', async () => {
      svc.getAllCategories.mockResolvedValue([{ id: 1, name: 'A', is_active: 1 }] as any);
      const ok = await request(app).get('/categories').expect(200);
      expect(ok.body).toHaveLength(1);
      svc.getAllCategories.mockRejectedValue(new Error('Database error'));
      await request(app).get('/categories').expect(500);
    });
  });

  describe('PUT /admin/categories/:category_id', () => {
    it('actualiza y convierte is_active', async () => {
      svc.updateCategory.mockResolvedValue({ id: 1, name: 'X', is_active: 1 } as any);
      const r = await request(app).put('/admin/categories/1').send({ is_active: true }).expect(200);
      expect(r.body.category.is_active).toBe(1);
    });
    it('inválido y conflictos', async () => {
      await request(app).put('/admin/categories/invalid').send({ name: 'X' }).expect(400);
      svc.updateCategory.mockRejectedValue({ status: 404, message: 'Categoría no encontrada' });
      await request(app).put('/admin/categories/999').send({ name: 'X' }).expect(404);
      svc.updateCategory.mockRejectedValue({ status: 409, message: 'Nombre de categoría ya en uso' });
      await request(app).put('/admin/categories/1').send({ name: 'dup' }).expect(409);
    });
  });

  describe('DELETE /admin/categories/:category_id', () => {
    it('ok, inválido, no encontrada y error', async () => {
      svc.deleteCategory.mockResolvedValue();
      await request(app).delete('/admin/categories/1').expect(200);
      await request(app).delete('/admin/categories/invalid').expect(400);
      svc.deleteCategory.mockRejectedValue({ status: 404, message: 'Categoría no encontrada' });
      await request(app).delete('/admin/categories/999').expect(404);
      svc.deleteCategory.mockRejectedValue(new Error('Database error'));
      await request(app).delete('/admin/categories/1').expect(500);
    });
  });
});