import request from 'supertest';
import express from 'express';
import { createSupplier, getSuppliers, updateSupplier, deleteSupplier, setSuppliersService } from '../../infraestructure/controllers/supplier.controller';
import { SuppliersService } from '../../application/supplier.service';

describe('Suppliers Controller Integration Tests', () => {
  let app: express.Application;
  let mockSuppliersService: jest.Mocked<SuppliersService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockSuppliersService = {
      createSupplier: jest.fn(),
      getAllSuppliers: jest.fn(),
      getSupplierById: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: jest.fn()
    } as any;

    // Inyectar el mock directamente en el controlador para que lo use durante las pruebas
    setSuppliersService(mockSuppliersService as any);

    app.post('/admin/suppliers', createSupplier);
    app.get('/suppliers', getSuppliers);
    app.put('/admin/suppliers/:supplier_id', updateSupplier);
    app.delete('/admin/suppliers/:supplier_id', deleteSupplier);
  });

  describe('POST /admin/suppliers', () => {
    it('should create supplier successfully', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '1234567890',
        address: 'Test Address',
        is_active: true
      };

      const expectedSupplier = {
        id: 1,
        ...supplierData,
        is_active: 1
      };

      mockSuppliersService.createSupplier.mockResolvedValue(expectedSupplier as any);

      const response = await request(app)
        .post('/admin/suppliers')
        .send(supplierData)
        .expect(201);

      expect(response.body.message).toBe('Proveedor creado');
      expect(response.body.supplier.id).toBe(1);
      expect(response.body.supplier.is_active).toBe(1);
    });

    it('should return error for duplicate supplier', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '1234567890',
        address: 'Test Address'
      };

      mockSuppliersService.createSupplier.mockRejectedValue({
        status: 409,
        message: 'Proveedor ya existe'
      });

      const response = await request(app)
        .post('/admin/suppliers')
        .send(supplierData)
        .expect(409);

      expect(response.body.message).toBe('Proveedor ya existe');
    });

    it('should return error for missing required fields', async () => {
      const invalidData = {
        email: 'supplier@example.com',
        phone: '1234567890'
      };

      // Simular que el servicio valida y rechaza por campos faltantes
      mockSuppliersService.createSupplier.mockRejectedValue({ status: 500, message: 'Campos requeridos faltantes' });

      const response = await request(app)
        .post('/admin/suppliers')
        .send(invalidData)
        .expect(500);

      expect(response.body.message).toBeDefined();
    });

    it('should handle boolean is_active conversion', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '1234567890',
        address: 'Test Address',
        is_active: 'true'
      };

      const expectedSupplier = {
        id: 1,
        ...supplierData,
        is_active: 1
      };

      mockSuppliersService.createSupplier.mockResolvedValue(expectedSupplier as any);

      const response = await request(app)
        .post('/admin/suppliers')
        .send(supplierData)
        .expect(201);

      expect(response.body.supplier.is_active).toBe(1);
    });
  });

  describe('GET /suppliers', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers = [
        {
          id: 1,
          name: 'Supplier 1',
          email: 'supplier1@example.com',
          is_active: 1
        },
        {
          id: 2,
          name: 'Supplier 2',
          email: 'supplier2@example.com',
          is_active: 1
        }
      ];

      mockSuppliersService.getAllSuppliers.mockResolvedValue(mockSuppliers as any);

      const response = await request(app)
        .get('/suppliers')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Supplier 1');
    });

    it('should return empty array when no suppliers exist', async () => {
      mockSuppliersService.getAllSuppliers.mockResolvedValue([]);

      const response = await request(app)
        .get('/suppliers')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PUT /admin/suppliers/:supplier_id', () => {
    it('should update supplier successfully', async () => {
      const supplierId = 1;
      const updateData = {
        name: 'Updated Supplier',
        email: 'updated@example.com',
        phone: '9876543210',
        address: 'Updated Address',
        is_active: false
      };

      const updatedSupplier = {
        id: supplierId,
        ...updateData,
        is_active: 0
      };

      mockSuppliersService.updateSupplier.mockResolvedValue(updatedSupplier as any);

      const response = await request(app)
        .put(`/admin/suppliers/${supplierId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Proveedor actualizado');
      expect(response.body.supplier.name).toBe('Updated Supplier');
      expect(response.body.supplier.is_active).toBe(0);
    });

    it('should return error for invalid supplier id', async () => {
      const response = await request(app)
        .put('/admin/suppliers/invalid-id')
        .send({ name: 'Updated Supplier' })
        .expect(400);

      expect(response.body.message).toBe('ID inválido');
    });

    it('should return error for non-existent supplier', async () => {
      const supplierId = 999;
      const updateData = { name: 'Updated Supplier' };

      mockSuppliersService.updateSupplier.mockRejectedValue({
        status: 404,
        message: 'Proveedor no encontrado'
      });

      const response = await request(app)
        .put(`/admin/suppliers/${supplierId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Proveedor no encontrado');
    });

    it('should return error for duplicate supplier name', async () => {
      const supplierId = 1;
      const updateData = { name: 'Existing Supplier Name' };

      mockSuppliersService.updateSupplier.mockRejectedValue({
        status: 409,
        message: 'Nombre de proveedor ya en uso'
      });

      const response = await request(app)
        .put(`/admin/suppliers/${supplierId}`)
        .send(updateData)
        .expect(409);

      expect(response.body.message).toBe('Nombre de proveedor ya en uso');
    });

    it('should handle partial updates', async () => {
      const supplierId = 1;
      const updateData = {
        phone: '5555555555'
      };

      const updatedSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '5555555555',
        address: 'Test Address'
      };

      mockSuppliersService.updateSupplier.mockResolvedValue(updatedSupplier as any);

      const response = await request(app)
        .put(`/admin/suppliers/${supplierId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.supplier.phone).toBe('5555555555');
      expect(response.body.supplier.name).toBe('Test Supplier');
    });
  });

  describe('DELETE /admin/suppliers/:supplier_id', () => {
    it('should delete supplier successfully', async () => {
      const supplierId = 1;

      mockSuppliersService.deleteSupplier.mockResolvedValue();

      const response = await request(app)
        .delete(`/admin/suppliers/${supplierId}`)
        .expect(200);

      expect(response.body.message).toBe('Proveedor eliminado');
    });

    it('should return error for invalid supplier id', async () => {
      const response = await request(app)
        .delete('/admin/suppliers/invalid-id')
        .expect(400);

      expect(response.body.message).toBe('ID inválido');
    });

    it('should return error for non-existent supplier', async () => {
      const supplierId = 999;

      mockSuppliersService.deleteSupplier.mockRejectedValue({
        status: 404,
        message: 'Proveedor no encontrado'
      });

      const response = await request(app)
        .delete(`/admin/suppliers/${supplierId}`)
        .expect(404);

      expect(response.body.message).toBe('Proveedor no encontrado');
    });
  });
});