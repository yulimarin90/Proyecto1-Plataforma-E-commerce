// src/Products/__tests__/unit/products.service.test.ts
import { ProductsService } from '../../application/products.service';
import { IProductsRepository } from '../../infraestructure/repositories/products.repository';

const mockProductsRepository: jest.Mocked<IProductsRepository> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNombre: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCategory: jest.fn()
};

describe('ProductsService', () => {
  let productsService: ProductsService;

  beforeEach(() => {
    productsService = new ProductsService(mockProductsRepository);
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        sku: 12345,
        category_id: 1,
        is_active: '1'
      };

      mockProductsRepository.findByNombre.mockResolvedValue(undefined);
      mockProductsRepository.create.mockResolvedValue(1);
      mockProductsRepository.findById.mockResolvedValue({ id: 1, ...productData } as any);

      const result = await productsService.createProduct(productData);

      expect(mockProductsRepository.findByNombre).toHaveBeenCalledWith(productData.name);
      expect(mockProductsRepository.create).toHaveBeenCalledWith(productData);
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
    });

    it('should throw error if product already exists', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        sku: 12345,
        category_id: 1,
        is_active: '1'
      };

      mockProductsRepository.findByNombre.mockResolvedValue({ id: 1, name: productData.name } as any);

      await expect(productsService.createProduct(productData)).rejects.toMatchObject({
        status: 409,
        message: 'Producto ya existe'
      });
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99
      };

      mockProductsRepository.findById.mockResolvedValue(mockProduct as any);

      const result = await productsService.getProductById(productId);

      expect(mockProductsRepository.findById).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockProduct);
    });

    it('should throw error if product not found', async () => {
      const productId = 999;

      mockProductsRepository.findById.mockResolvedValue(undefined);

      await expect(productsService.getProductById(productId)).rejects.toMatchObject({
        status: 404,
        message: 'Producto no encontrado'
      });
    });
  });
});