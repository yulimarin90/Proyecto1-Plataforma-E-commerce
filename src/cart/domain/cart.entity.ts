// Entidad e interfaces, reglas del negocio  
// Representa la estructura y lógica principal para la gestión del carrito de compras  
// Incluye control de stock, expiración e inmovilización de precios  

// Representa cada producto dentro del carrito  
// Contiene información sobre cantidad, precio y control de stock  
export interface CartItem {
  product_id: number;             // ID único del producto  
  name: string;                   // Nombre del producto  
  price: number;                  // Precio unitario del producto  
  quantity: number;               // Cantidad seleccionada  
  stock_available: number;        // Stock disponible en el momento de agregarlo  
  added_at: Date;                 // Fecha y hora en que se añadió al carrito  
  price_locked_until: Date;       // Fecha hasta la cual el precio se mantiene congelado  
  subtotal?: number;              // Subtotal calculado (price * quantity)  
}

// Para cuando se crea un nuevo carrito  
// Contiene los productos añadidos, el total y la información del usuario  
export interface NewCart {
  user_id: number;                // ID del usuario propietario del carrito  
  items: CartItem[];              // Lista de productos en el carrito  
  total_amount?: number;          // Total general del carrito  
  created_at?: Date;              // Fecha de creación  
  updated_at?: Date;              // Fecha de última actualización  
  expires_at?: Date;              // Fecha y hora de expiración (24h sin actividad)  
  status?: "active" | "expired" | "completed"; // Estado actual del carrito  
}

// Para carritos que ya existen en el sistema  
export interface Cart extends NewCart {
  id: number;                     // Identificador único del carrito  
}

// Clase CartOperations  
// Define las operaciones principales y las reglas de negocio del carrito  
export class CartOperations {
  constructor(public cart: Cart) {}

  // Agregar un nuevo producto o aumentar su cantidad si ya existe  
  // Verifica el stock disponible y congela el precio por 2 horas  
  addItem(product: Omit<CartItem, "added_at" | "price_locked_until" | "subtotal">) {
    const existing = this.cart.items.find(i => i.product_id === product.product_id);
    const now = new Date();

    if (existing) {
      const newQuantity = existing.quantity + product.quantity;
      if (newQuantity > existing.stock_available) {
        throw new Error("Cantidad supera el stock disponible");
      }
      existing.quantity = newQuantity;
      existing.subtotal = existing.price * existing.quantity;
    } else {
      if (product.quantity > product.stock_available) {
        throw new Error("Cantidad supera el stock disponible");
      }

      const lockedUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 horas  
      const newItem: CartItem = {
        ...product,
        added_at: now,
        price_locked_until: lockedUntil,
        subtotal: product.price * product.quantity
      };
      this.cart.items.push(newItem);
    }

    this.refreshTotals();
  }

  // Actualizar la cantidad de un producto existente  
  // Verifica stock en tiempo real antes de aplicar los cambios  
  updateQuantity(product_id: number, quantity: number, currentStock: number) {
    const item = this.cart.items.find(i => i.product_id === product_id);
    if (!item) throw new Error("Producto no encontrado en el carrito");
    if (quantity <= 0) throw new Error("Cantidad inválida");
    if (quantity > currentStock) throw new Error("Cantidad supera el stock disponible");

    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    this.refreshTotals();
  }

  // Eliminar un producto del carrito  
  removeItem(product_id: number) {
    this.cart.items = this.cart.items.filter(i => i.product_id !== product_id);
    this.refreshTotals();
  }

  // Vaciar completamente el carrito  
  clear() {
    this.cart.items = [];
    this.cart.total_amount = 0;
    this.cart.updated_at = new Date();
  }

  // Verificar si el carrito ha expirado (más de 24 horas sin actividad)  
  checkExpiration() {
    const now = new Date();
    if (this.cart.expires_at && now > this.cart.expires_at) {
      this.cart.status = "expired";
      throw new Error("El carrito ha expirado por inactividad");
    }
  }

  // Recalcular totales y actualizar fechas  
  private refreshTotals() {
    this.cart.total_amount = this.cart.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    this.cart.updated_at = new Date();

    // Extiende la expiración 24 horas desde la última modificación  
    const expires = new Date(this.cart.updated_at.getTime() + 24 * 60 * 60 * 1000);
    this.cart.expires_at = expires;
  }
}
