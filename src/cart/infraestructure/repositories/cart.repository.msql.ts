import { Cart } from "../../domain/cart.entity";
import { CartRepository } from "./cart.repository";

const carts: Record<string, Cart> = {}; // Simulación temporal

export class CartRepositoryMySQL implements CartRepository {
  async findByUser(userId: string): Promise<Cart | null> {
    return carts[userId] || null;
  }

  async save(cart: Cart): Promise<void> {
    carts[cart.userId] = cart;
  }
}
