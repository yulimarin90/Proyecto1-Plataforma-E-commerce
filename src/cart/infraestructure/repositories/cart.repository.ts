// src/Cart/infraestructure/repositories/cart.repository.ts
import { Cart, NewCart } from "../../domain/cart.entity";

export interface CartRepository {
  findByUser(userId: string): Promise<Cart | null>;
  save(cart: Cart | NewCart): Promise<void>;
  delete(cartId: number): Promise<void>;
}
