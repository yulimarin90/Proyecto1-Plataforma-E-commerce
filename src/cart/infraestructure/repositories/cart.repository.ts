// Define las operaciones que cualquier implementación del repositorio (MySQL, memoria, API, etc.)
// debe cumplir para gestionar la persistencia del carrito y sus ítems.
import { Cart, NewCart } from "../../domain/cart.entity";


export interface ICartRepository {
  
  create?(cart: NewCart): Promise<number>; 
  findByUser(userId: number): Promise<Cart | null>;
  findById?(id: number): Promise<Cart | null>;
  update?(id: number, data: Partial<Cart>): Promise<void>;
  save(cart: Cart): Promise<void>;
  deleteCart(userId: number): Promise<void>;
  clearItems(cartId: number): Promise<void>;

  
   // Agrega o actualiza un producto dentro de un carrito.
   // Si el producto ya existe, actualiza cantidad, precio y subtotal.
   // Si no, lo inserta como un nuevo ítem.
  upsertItem(
    cartId: number,
    productId: number,
    quantity: number,
    price: number,
    stockAvailable: number
  ): Promise<void>;

  
   // Elimina un ítem específico del carrito.
  removeItem(cartId: number, productId: number): Promise<void>;
}
