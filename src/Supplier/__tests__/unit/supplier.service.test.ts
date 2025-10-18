import { SuppliersService } from '../../application/supplier.service';
import { ISuppliersRepository } from '../../infraestructure/repositories/supplier.repository';
import { Supplier } from '../../domain/supplier.entity';

const createMockSuppliersRepository = (): jest.Mocked<ISuppliersRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
});

describe('SuppliersService', () => {
  let suppliersService: SuppliersService;
  let mockRepository: jest.Mocked<ISuppliersRepository>;

  beforeEach(() => {
    mockRepository = createMockSuppliersRepository();
    suppliersService = new SuppliersService(mockRepository);
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

  mockRepository.findByName.mockResolvedValue(undefined);
      mockRepository.create.mockResolvedValue(1);
      mockRepository.findById.mockResolvedValue({ id: 1, ...supplierData } as any);

      const result = await suppliersService.createSupplier(supplierData as any);

      expect(mockRepository.findByName).toHaveBeenCalledWith(supplierData.name);
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

      mockRepository.findByName.mockResolvedValue({ id: 1, name: supplierData.name } as any);

      await expect(suppliersService.createSupplier(supplierData as any)).rejects.toMatchObject({
        status: 409,
        message: 'Proveedor ya existe'
      });
    });
  });

  describe('getAllSuppliers', () => {
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

      mockRepository.findAll.mockResolvedValue(mockSuppliers as any);

      const result = await suppliersService.getAllSuppliers();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier by id', async () => {
      const supplierId = 1;
      const mockSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'supplier@example.com'
      } as Supplier;

      mockRepository.findById.mockResolvedValue(mockSupplier);

      const result = await suppliersService.getSupplierById(supplierId);

      expect(mockRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(mockSupplier);
    });

    it('should throw error if supplier not found', async () => {
      const supplierId = 999;

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(suppliersService.getSupplierById(supplierId)).rejects.toMatchObject({
        status: 404,
        message: 'Proveedor no encontrado'
      });
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier successfully', async () => {
      const supplierId = 1;
      const updateData = {
        name: 'Updated Supplier',
        email: 'updated@example.com'
      };

      const existingSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'supplier@example.com'
      } as Supplier;

      const updatedSupplier = {
        ...existingSupplier,
        ...updateData
      };

      mockRepository.findById.mockResolvedValue(existingSupplier);
      mockRepository.update.mockResolvedValue(updatedSupplier);

      const result = await suppliersService.updateSupplier(supplierId, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(updatedSupplier);
    });

    it('should throw error if supplier not found', async () => {
      const supplierId = 999;
      const updateData = { name: 'Updated Supplier' };

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(suppliersService.updateSupplier(supplierId, updateData)).rejects.toMatchObject({
        status: 404,
        message: 'Proveedor no encontrado'
      });
    });

    it('should throw error if supplier name already exists', async () => {
      const supplierId = 1;
      const updateData = { name: 'Existing Supplier Name' };

      const existingSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'supplier@example.com'
      } as Supplier;

      const conflictingSupplier = {
        id: 2,
        name: 'Existing Supplier Name',
        email: 'existing@example.com'
      } as Supplier;

      mockRepository.findById.mockResolvedValue(existingSupplier);
      mockRepository.findByName.mockResolvedValue(conflictingSupplier);

      await expect(suppliersService.updateSupplier(supplierId, updateData)).rejects.toMatchObject({
        status: 409,
        message: 'Nombre de proveedor ya en uso'
      });
    });
  });

  describe('deleteSupplier', () => {
    it('should delete supplier successfully', async () => {
      const supplierId = 1;
      const existingSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'supplier@example.com'
      } as Supplier;

      mockRepository.findById.mockResolvedValue(existingSupplier);
      mockRepository.delete.mockResolvedValue();

      await suppliersService.deleteSupplier(supplierId);

      expect(mockRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(mockRepository.delete).toHaveBeenCalledWith(supplierId);
    });

    it('should throw error if supplier not found', async () => {
      const supplierId = 999;

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(suppliersService.deleteSupplier(supplierId)).rejects.toMatchObject({
        status: 404,
        message: 'Proveedor no encontrado'
      });
    });
  });
});