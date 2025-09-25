import { Product } from "./product.entity";

const products: Product[] = [];

export class ProductRepository {
  async create(product: Product): Promise<Product> {
    products.push(product);
    return product;
  }

  async findAll(): Promise<Product[]> {
    return products;
  }

  async findById(id: string): Promise<Product | undefined> {
    return products.find(p => p.id === id);
  }

  async update(id: string, updateData: Partial<Product>): Promise<Product | null> {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = { ...products[index], ...updateData };
    return products[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
  }
}
