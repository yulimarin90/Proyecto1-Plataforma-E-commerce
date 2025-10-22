// Define las operaciones que cualquier implementación del repositorio (MySQL, memoria, API, etc.)
// debe cumplir para gestionar la persistencia del carrito y sus ítems.
import { Cart, NewCart } from "../../domain/cart.entity";


export interface ICartRepository {
  findByUser(userId: number): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
  findProductById(productId: number): Promise<any>;
  decreaseProductStock(productId: number, quantity: number): Promise<void>;
  createOrder(orderData: any): Promise<number>;            // retorna order_id
  createOrderItem(orderItemData: any): Promise<void>;
  findOrderById(orderId: number): Promise<any>;
  markCartAsCheckedOut(cartId: number): Promise<void>;
  updateStatus(cartId: number, status: string): Promise<void>;
  delete(cartId: number): Promise<void>;


}

  
   