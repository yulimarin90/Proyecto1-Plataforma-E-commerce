import { CartRepository } from "../infraestructure/repositories/cart.repository";
import { Cart } from "../domain/cart.entity";

export class CartService {
  constructor(private repository: CartRepository) {}

  async getCart(userId: string) {
    let cart = await this.repository.findByUser(userId);
    if (!cart) {
      cart = new Cart(userId);
      await this.repository.save(cart);
    }
    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) throw new Error("Cantidad inválida");
    const cart = await this.getCart(userId);
    cart.addItem(productId, quantity);
    await this.repository.save(cart);
    return cart;
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) throw new Error("Cantidad inválida");
    const cart = await this.getCart(userId);
    cart.updateQuantity(productId, quantity);
    await this.repository.save(cart);
    return cart;
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getCart(userId);
    cart.removeItem(productId);
    await this.repository.save(cart);
    return cart;
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    cart.clear();
    await this.repository.save(cart);
  }
}
