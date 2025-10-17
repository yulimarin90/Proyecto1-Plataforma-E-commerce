// src/categories/__tests__/unit/categories.service.test.ts
import { CategoriesService } from '../../application/categories.service';
import { ICategoriesRepository } from '../../infraestructure/repositories/categories.repository';

const mockCategoriesRepository: jest.Mocked<ICategoriesRepository> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;

  beforeEach(() => {
    categoriesService = new CategoriesService(mockCategoriesRepository);
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description',
        is_active: 1
      };

      mockCategoriesRepository.findByName.mockResolvedValue(undefined);
      mockCategoriesRepository.create.mockResolvedValue(1);
      mockCategoriesRepository.findById.mockResolvedValue({ id: 1, ...categoryData } as any);

      const result = await categoriesService.createCategory(categoryData as any);

      expect(mockCategoriesRepository.findByName).toHaveBeenCalledWith(categoryData.name);
      expect(mockCategoriesRepository.create).toHaveBeenCalledWith(categoryData);
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
    });

    it('should throw error if category already exists', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description',
        is_active: 1
      };

      mockCategoriesRepository.findByName.mockResolvedValue({ id: 1, name: categoryData.name } as any);

      await expect(categoriesService.createCategory(categoryData as any)).rejects.toMatchObject({
        status: 409,
        message: 'Categoría ya existe'
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const categoryId = 1;
      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description'
      };

      mockCategoriesRepository.findById.mockResolvedValue(mockCategory as any);

      const result = await categoriesService.getCategoryById(categoryId);

      expect(mockCategoriesRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(mockCategory);
    });

    it('should throw error if category not found', async () => {
      const categoryId = 999;

      mockCategoriesRepository.findById.mockResolvedValue(undefined);

      await expect(categoriesService.getCategoryById(categoryId)).rejects.toMatchObject({
        status: 404,
        message: 'Categoría no encontrada'
      });
    });
  });
});