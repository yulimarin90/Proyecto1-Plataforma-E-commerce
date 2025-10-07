// products/application/products.service.ts
import { ProductsRepository } from "../infraestructure/repositories/products.repository";
import { Product } from "../domain/products.entity";

export class ProductsService {
  static async createProduct(product: Product) {
    const exists = await ProductsRepository.findByNombre(product.name);
    if (exists) return "ALREADY_EXISTS";
    const id = await ProductsRepository.create(product);
    return await ProductsRepository.findById(id);
  }

  static async getAllProducts() {
    return await ProductsRepository.findAll();
  }

  static async getProductById(id: string) {
    return await ProductsRepository.findById(Number(id));
  }

  static async updateProduct(id: string, data: Partial<Product>) {
    const product = await ProductsRepository.findById(Number(id));
    if (!product) return "NOT_FOUND";
    if (data.name && data.name !== product.name) {
      const exists = await ProductsRepository.findByNombre(data.name);
      if (exists) return "CONFLICT";
    }
    return await ProductsRepository.update(Number(id), { ...product, ...data });
  }

  static async deleteProduct(id: string): Promise<"NOT_FOUND" | "HAS_ORDERS" | "DELETED"> {
    const product = await ProductsRepository.findById(Number(id));
    if (!product) return "NOT_FOUND";

    // aquí iría validación si hay órdenes asociadas → "HAS_ORDERS"
    // por ahora devolvemos ok
    await ProductsRepository.delete(Number(id));
    return "DELETED";
  }

  static async getProductsByCategory(categoryId: string) {
    return await ProductsRepository.findByCategory(Number(categoryId));
  }
}
