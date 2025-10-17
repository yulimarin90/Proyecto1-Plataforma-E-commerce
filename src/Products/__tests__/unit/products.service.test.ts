import { ProductsService } from '../../application/products.service';
import { IProductsRepository } from '../../infraestructure/repositories/products.repository';
import { Product } from '../../domain/products.entity';

const createMockProductsRepository = (): jest.Mocked<IProductsRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNombre: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCategory: jest.fn()
});

describe('ProductsService', () => {
  let productsService: ProductsService;
  let mockRepository: jest.Mocked<IProductsRepository>;

  beforeEach(() => {
    mockRepository = createMockProductsRepository();
    productsService = new ProductsService(mockRepository);
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

      mockRepository.findByNombre.mockResolvedValue(undefined);
      mockRepository.create.mockResolvedValue(1);
      mockRepository.findById.mockResolvedValue({ id: 1, ...productData } as any);

      const result = await productsService.createProduct(productData as any);

      expect(mockRepository.findByNombre).toHaveBeenCalledWith(productData.name);
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

      mockRepository.findByNombre.mockResolvedValue({ id: 1, name: productData.name } as any);

      await expect(productsService.createProduct(productData as any)).rejects.toMatchObject({
        status: 409,
        message: 'Producto ya existe'
      });
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
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

      mockRepository.findAll.mockResolvedValue(mockProducts as any);

      const result = await productsService.getAllProducts();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99
      } as Product;

      mockRepository.findById.mockResolvedValue(mockProduct);

      const result = await productsService.getProductById(productId);

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockProduct);
    });

    it('should throw error if product not found', async () => {
      const productId = 999;

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(productsService.getProductById(productId)).rejects.toMatchObject({
        status: 404,
        message: 'Producto no encontrado'
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const productId = 1;
      const updateData = {
        name: 'Updated Product',
        price: 149.99
      };

      const existingProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        description: 'Test Description'
      } as Product;

      const updatedProduct = {
        ...existingProduct,
        ...updateData
      };

      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.update.mockResolvedValue(updatedProduct);

      const result = await productsService.updateProduct(productId, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(result).toEqual(updatedProduct);
    });

    it('should throw error if product not found', async () => {
      const productId = 999;
      const updateData = { name: 'Updated Product' };

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(productsService.updateProduct(productId, updateData)).rejects.toMatchObject({
        status: 404,
        message: 'Producto no encontrado'
      });
    });

    it('should throw error if product name already exists', async () => {
      const productId = 1;
      const updateData = { name: 'Existing Product Name' };

      const existingProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99
      } as Product;

      const conflictingProduct = {
        id: 2,
        name: 'Existing Product Name',
        price: 149.99
      } as Product;

      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.findByNombre.mockResolvedValue(conflictingProduct);

      await expect(productsService.updateProduct(productId, updateData)).rejects.toMatchObject({
        status: 409,
        message: 'Nombre de producto ya en uso'
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const productId = 1;
      const existingProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99
      } as Product;

      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.delete.mockResolvedValue();

      await productsService.deleteProduct(productId);

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.delete).toHaveBeenCalledWith(productId);
    });

    it('should throw error if product not found', async () => {
      const productId = 999;

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(productsService.deleteProduct(productId)).rejects.toMatchObject({
        status: 404,
        message: 'Producto no encontrado'
      });
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      const categoryId = 1;
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 99.99,
          category_id: categoryId
        },
        {
          id: 2,
          name: 'Product 2',
          price: 149.99,
          category_id: categoryId
        }
      ];

      mockRepository.findByCategory.mockResolvedValue(mockProducts as any);

      const result = await productsService.getProductsByCategory(categoryId);

      expect(mockRepository.findByCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toHaveLength(2);
    });
  });
});