import { CategoriesService } from '../../application/categories.service';
import { ICategoriesRepository } from '../../infraestructure/repositories/categories.repository';
import { Category } from '../../domain/categories.entity';

const createMockCategoriesRepository = (): jest.Mocked<ICategoriesRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
});

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let mockRepository: jest.Mocked<ICategoriesRepository>;

  beforeEach(() => {
    mockRepository = createMockCategoriesRepository();
    categoriesService = new CategoriesService(mockRepository);
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description',
        is_active: 1
      };

      mockRepository.findByName.mockResolvedValue(undefined);
      mockRepository.create.mockResolvedValue(1);
      mockRepository.findById.mockResolvedValue({ id: 1, ...categoryData } as any);

      const result = await categoriesService.createCategory(categoryData as any);

      expect(mockRepository.findByName).toHaveBeenCalledWith(categoryData.name);
      expect(result!.id).toBe(1);
    });

    it('should throw error if category already exists', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description',
        is_active: 1
      };

      mockRepository.findByName.mockResolvedValue({ id: 1, name: categoryData.name } as any);

      await expect(categoriesService.createCategory(categoryData as any)).rejects.toMatchObject({
        status: 409,
        message: 'Categoría ya existe'
      });
    });
  });

  describe('getAllCategories', () => {
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

      mockRepository.findAll.mockResolvedValue(mockCategories as any);

      const result = await categoriesService.getAllCategories();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const categoryId = 1;
      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description'
      } as Category;

      mockRepository.findById.mockResolvedValue(mockCategory);

      const result = await categoriesService.getCategoryById(categoryId);

      expect(mockRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(mockCategory);
    });

    it('should throw error if category not found', async () => {
      const categoryId = 999;

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(categoriesService.getCategoryById(categoryId)).rejects.toMatchObject({
        status: 404,
        message: 'Categoría no encontrada'
      });
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const categoryId = 1;
      const updateData = {
        name: 'Updated Category',
        description: 'Updated Description'
      };

      const existingCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description'
      } as Category;

      const updatedCategory = {
        ...existingCategory,
        ...updateData
      };

      mockRepository.findById.mockResolvedValue(existingCategory);
      mockRepository.update.mockResolvedValue(updatedCategory);

      const result = await categoriesService.updateCategory(categoryId, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(updatedCategory);
    });

    it('should throw error if category not found', async () => {
      const categoryId = 999;
      const updateData = { name: 'Updated Category' };

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(categoriesService.updateCategory(categoryId, updateData)).rejects.toMatchObject({
        status: 404,
        message: 'Categoría no encontrada'
      });
    });

    it('should throw error if category name already exists', async () => {
      const categoryId = 1;
      const updateData = { name: 'Existing Category Name' };

      const existingCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description'
      } as Category;

      const conflictingCategory = {
        id: 2,
        name: 'Existing Category Name',
        description: 'Existing Description'
      } as Category;

      mockRepository.findById.mockResolvedValue(existingCategory);
      mockRepository.findByName.mockResolvedValue(conflictingCategory);

      await expect(categoriesService.updateCategory(categoryId, updateData)).rejects.toMatchObject({
        status: 409,
        message: 'Nombre de categoría ya en uso'
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const categoryId = 1;
      const existingCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description'
      } as Category;

      mockRepository.findById.mockResolvedValue(existingCategory);
      mockRepository.delete.mockResolvedValue();

      await categoriesService.deleteCategory(categoryId);

      expect(mockRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(mockRepository.delete).toHaveBeenCalledWith(categoryId);
    });

    it('should throw error if category not found', async () => {
      const categoryId = 999;

      mockRepository.findById.mockResolvedValue(undefined);

      await expect(categoriesService.deleteCategory(categoryId)).rejects.toMatchObject({
        status: 404,
        message: 'Categoría no encontrada'
      });
    });
  });
});