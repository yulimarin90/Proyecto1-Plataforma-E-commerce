import { ProductsRepository, IProductsRepository } from "../infraestructure/repositories/products.repository";
import { Product } from "../domain/products.entity";

export class ProductsService {
  constructor(private productsRepository: IProductsRepository) {}

  // Crear producto
  async createProduct(product: Product) {
    const exists = await this.productsRepository.findByNombre(product.name);
    if (exists) throw { status: 409, message: "Producto ya existe" };

    const id = await this.productsRepository.create(product);
    return await this.productsRepository.findById(id);
  }

  // Obtener todos los productos
  async getAllProducts() {
    return await this.productsRepository.findAll();
  }

  // Obtener producto por ID
  async getProductById(id: number) {
    const product = await this.productsRepository.findById(id);
    if (!product) throw { status: 404, message: "Producto no encontrado" };
    return product;
  }

  // Actualizar producto
  async updateProduct(id: number, data: Partial<Product>) {
    const product = await this.productsRepository.findById(id);
    if (!product) throw { status: 404, message: "Producto no encontrado" };

    if (data.name && data.name !== product.name) {
      const exists = await this.productsRepository.findByNombre(data.name);
      if (exists) throw { status: 409, message: "Nombre de producto ya en uso" };
    }

    return await this.productsRepository.update(id, { ...product, ...data });
  }

  // Eliminar producto
  async deleteProduct(id: number): Promise<void> {
    const product = await this.productsRepository.findById(id);
    if (!product) throw { status: 404, message: "Producto no encontrado" };

    // Aquí podrías validar si hay órdenes asociadas
    await this.productsRepository.delete(id);
  }

  // Obtener productos por categoría
  async getProductsByCategory(categoryId: number) {
    return await this.productsRepository.findByCategory(categoryId);
  }

  //paginacion
  async getFilteredProducts(page: number, limit: number, search?: string) {
  return await this.productsRepository.findFiltered(page, limit, search);
}
}
