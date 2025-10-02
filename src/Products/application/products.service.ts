import { Product } from "../domain/products.entity";
import { ProductRepository } from "../infraestructure/repositories/products.repository";

export class ProductService {
  // No necesitamos instanciar el repositorio porque todos sus métodos son estáticos.

  async create(data: Omit<Product, "id" | "created_at" | "updated_at">) {
    const product: Product = {
      id: 0, // Valor temporal, no se usará en la inserción
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    return ProductRepository.create(product);
  }

  async findAll() {
    return ProductRepository.findAll();
  }

  async findById(id: number) {
    return ProductRepository.findById(id);
  }

  async update(id: number, data: Partial<Product>) {
    return ProductRepository.update(id, data);
  }

  async delete(id: number) {
    return ProductRepository.delete(id);
  }
}