import { ICartRepository } from "../infraestructure/repositories/cart.repository";
import { Cart, CartItem } from "../domain/cart.entity";
import { CartOperations } from "../domain/cart.operations";

export class CartService {
  constructor(private repository: ICartRepository) {}

  // Obtener carrito del usuario o crearlo si no existe
  async getCart(userId: number): Promise<Cart> {
    let cart = await this.repository.findByUser(userId);

    // Si no existe, crear uno nuevo
    if (!cart) {
      cart = {
        id: 0,
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "active",
      };
      await this.repository.save(cart);
    }

    // Verificar expiración
    const operations = new CartOperations(cart);
    operations.checkExpiration();

    return cart;
  }

  // Agregar producto al carrito
  async addItem(
    userId: number,
    product: Omit<CartItem, "added_at" | "price_locked_until" | "subtotal">
  ) {
    // Validaciones iniciales
    if (!product.product_id || typeof product.product_id !== "number") {
      throw new Error("El ID del producto no es válido");
    }
    if (product.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }
    if (product.price <= 0) {
      throw new Error("El precio debe ser mayor a 0");
    }
    if (product.stock_available < product.quantity) {
      throw new Error("Cantidad supera el stock disponible");
    }

    // Obtener carrito
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    // Agregar producto mediante CartOperations
    operations.addItem(product);

    // Guardar cambios
    await this.repository.save(cart);
    return cart;
  }

  // Actualizar cantidad de un producto existente
  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    currentStock: number
  ) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.updateQuantity(productId, quantity, currentStock);

    await this.repository.save(cart);
    return cart;
  }

  // Eliminar un producto del carrito
  async removeItem(userId: number, productId: number) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.removeItem(productId);

    await this.repository.save(cart);
    return cart;
  }

  // Vaciar carrito
  async clearCart(userId: number) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.clear();

    await this.repository.save(cart);
  }
}