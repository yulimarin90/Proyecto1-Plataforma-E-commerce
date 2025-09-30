import { Product } from "../domain/products.entity";
import { ProductRepository } from "../infraestructure/repositories/products.repository.msql";
import { v4 as uuid } from "uuid";

export class ProductService {
  private repository = new ProductRepository();

  async create(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    const product: Product = {
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    return this.repository.create(product);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    return this.repository.findById(id);
  }

  async update(id: string, data: Partial<Product>) {
    data.updatedAt = new Date();
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
