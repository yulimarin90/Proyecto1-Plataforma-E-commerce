// Define las operaciones que cualquier implementación del repositorio (MySQL, memoria, API, etc.)
// debe cumplir para gestionar la persistencia del carrito y sus ítems.
import { Cart, NewCart } from "../../domain/cart.entity";


 // Define las operaciones principales que deben implementarse
 // por cualquier fuente de datos (MySQL, memoria, API externa, etc.).
 // Esta interfaz mantiene la independencia entre el dominio y la infraestructura.
export interface ICartRepository {
  
  // Crea un nuevo carrito para un usuario.
  // Devuelve el ID autogenerado del carrito creado.
  create?(cart: NewCart): Promise<number>; // Opcional

  
   // Busca y devuelve el carrito de un usuario dado su ID.
   // Si el usuario no tiene carrito, retorna `null`.
  findByUser(userId: number): Promise<Cart | null>;

  
   // Busca un carrito directamente por su ID.
  findById?(id: number): Promise<Cart | null>;

  
   // Actualiza los datos de un carrito existente.
   // Acepta actualizaciones parciales.
  update?(id: number, data: Partial<Cart>): Promise<void>;

  
   // Guarda (crea o actualiza) un carrito y sus ítems asociados.
   // Si el carrito no existe, lo inserta; si existe, lo reemplaza.
  save(cart: Cart): Promise<void>;

  
   // Elimina un carrito y todos sus ítems asociados del sistema.
  deleteCart(userId: number): Promise<void>;


   // Limpia todos los ítems de un carrito sin eliminarlo.
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
