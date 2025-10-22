
// src/suppliers/__tests__/integration/supplier.controller.test.ts
import request from 'supertest';
import express from 'express';
import { createSupplier, getSuppliers, updateSupplier, setSuppliersService } from '../../infraestructure/controllers/supplier.controller';
import { SuppliersService } from '../../application/supplier.service';

jest.mock('../../application/supplier.service');
const MockedSuppliersService = SuppliersService as jest.MockedClass<typeof SuppliersService>;

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

  MockedSuppliersService.mockImplementation(() => mockSuppliersService);
  // Inyectar la instancia mock en el controlador
  setSuppliersService(mockSuppliersService);

    app.post('/admin/suppliers', createSupplier);
    app.get('/suppliers', getSuppliers);
    app.put('/admin/suppliers/:supplier_id', updateSupplier);
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
  });
});