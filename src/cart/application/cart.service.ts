// Servicio CartService: contiene la lógica de negocio para la gestión del carrito de compras
// Aplica las reglas del dominio (CartOperations) e interactúa con el repositorio para persistir datos

import { CartRepository } from "../infraestructure/repositories/cart.repository";
import { Cart, CartOperations, CartItem } from "../domain/cart.entity";

export class CartService {
  constructor(private repository: CartRepository) {}

  // Obtener el carrito actual del usuario
  // Si el usuario no tiene un carrito creado, se genera uno nuevo y se guarda en el repositorio
  async getCart(userId: number): Promise<Cart> {
    let cart = await this.repository.findByUser(userId.toString());
    if (!cart) {
      cart = {
        id: 0, // Se define un valor temporal hasta que el repositorio lo asigne
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // expira en 24 horas
        status: "active",
      };
      await this.repository.save(cart);
    }

    // Verificar si el carrito ha expirado
    const operations = new CartOperations(cart);
    operations.checkExpiration();

    return cart;
  }

  // Agregar un producto al carrito
  // Aplica validaciones de stock y congelamiento de precio según las reglas del dominio
  async addItem(
    userId: number,
    product: Omit<CartItem, "added_at" | "price_locked_until" | "subtotal">
  ) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.addItem(product);
    await this.repository.save(operations.cart);

    return operations.cart;
  }

  // Actualizar la cantidad de un producto existente en el carrito
  // Verifica stock en tiempo real antes de aplicar cambios
  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    currentStock: number
  ) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.updateQuantity(productId, quantity, currentStock);
    await this.repository.save(operations.cart);

    return operations.cart;
  }

  // Eliminar un producto del carrito
  async removeItem(userId: number, productId: number) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.removeItem(productId);
    await this.repository.save(operations.cart);

    return operations.cart;
  }

  // Vaciar completamente el carrito de un usuario
  async clearCart(userId: number) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.clear();
    await this.repository.save(operations.cart);
  }
}
