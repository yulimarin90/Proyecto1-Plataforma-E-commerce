// src/suppliers/__tests__/unit/supplier.service.test.ts
import { SuppliersService } from '../../application/supplier.service';
import { ISuppliersRepository } from '../../infraestructure/repositories/supplier.repository';

const mockSuppliersRepository: jest.Mocked<ISuppliersRepository> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('SuppliersService', () => {
  let suppliersService: SuppliersService;

  beforeEach(() => {
    suppliersService = new SuppliersService(mockSuppliersRepository);
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create supplier successfully', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '1234567890',
        address: 'Test Address'
      };

      mockSuppliersRepository.findByName.mockResolvedValue(undefined);
      mockSuppliersRepository.create.mockResolvedValue(1);
      mockSuppliersRepository.findById.mockResolvedValue({ id: 1, ...supplierData } as any);

      const result = await suppliersService.createSupplier(supplierData as any);

      expect(mockSuppliersRepository.findByName).toHaveBeenCalledWith(supplierData.name);
      expect(mockSuppliersRepository.create).toHaveBeenCalledWith(supplierData);
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
    });

    it('should throw error if supplier already exists', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '1234567890',
        address: 'Test Address'
      };

      mockSuppliersRepository.findByName.mockResolvedValue({ id: 1, name: supplierData.name } as any);

      await expect(suppliersService.createSupplier(supplierData as any)).rejects.toMatchObject({
        status: 409,
        message: 'Proveedor ya existe'
      });
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier by id', async () => {
      const supplierId = 1;
      const mockSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'supplier@example.com'
      };

      mockSuppliersRepository.findById.mockResolvedValue(mockSupplier as any);

      const result = await suppliersService.getSupplierById(supplierId);

      expect(mockSuppliersRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(mockSupplier);
    });

    it('should throw error if supplier not found', async () => {
      const supplierId = 999;

      mockSuppliersRepository.findById.mockResolvedValue(undefined);

      await expect(suppliersService.getSupplierById(supplierId)).rejects.toMatchObject({
        status: 404,
        message: 'Proveedor no encontrado'
      });
    });
  });
});