import { Cart } from "../../domain/cart.entity";

export interface CartRepository {
  findByUser(userId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
}
