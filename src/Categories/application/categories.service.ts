import { ICategoriesRepository, CategoriesRepository } from "../infraestructure/repositories/categories.repository";
import { Category } from "../domain/categories.entity";

export class CategoriesService {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  async createCategory(category: Category) {
    const exists = await this.categoriesRepository.findByName(category.name);
    if (exists) throw { status: 409, message: "Categoría ya existe" };
    const id = await this.categoriesRepository.create(category);
    return await this.categoriesRepository.findById(id);
  }

  async getAllCategories() {
    return await this.categoriesRepository.findAll();
  }

  async getCategoryById(id: number) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw { status: 404, message: "Categoría no encontrada" };
    return category;
  }

  async updateCategory(id: number, data: Partial<Category>) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw { status: 404, message: "Categoría no encontrada" };

    if (data.name && data.name !== category.name) {
      const exists = await this.categoriesRepository.findByName(data.name);
      if (exists) throw { status: 409, message: "Nombre de categoría ya en uso" };
    }

    return await this.categoriesRepository.update(id, { ...category, ...data });
  }

  async deleteCategory(id: number) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw { status: 404, message: "Categoría no encontrada" };
    await this.categoriesRepository.delete(id);
  }
}
