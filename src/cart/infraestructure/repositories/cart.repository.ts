
import { Cart, NewCart } from "../../domain/cart.entity";


export interface ICartRepository {
  
  create?(cart: NewCart): Promise<number>; 
  findByUser(userId: number): Promise<Cart | null>;
  findById?(id: number): Promise<Cart | null>;
  update?(id: number, data: Partial<Cart>): Promise<void>;
  save(cart: Cart): Promise<void>;
  deleteCart(userId: number): Promise<void>;
  clearItems(cartId: number): Promise<void>;
  upsertItem(
    cartId: number,
    productId: number,
    quantity: number,
    price: number,
    stockAvailable: number
  ): Promise<void>;

  removeItem(cartId: number, productId: number): Promise<void>;
}
