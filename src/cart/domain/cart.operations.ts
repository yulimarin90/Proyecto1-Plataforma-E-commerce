import { Cart, CartItem } from "./cart.entity";

export class CartOperations {
  constructor(public cart: Cart) {}

  // 🛍️ Agrega un producto al carrito o aumenta la cantidad si ya existe
  addItem(
    product: Omit<CartItem, "created_at" | "updated_at" | "subtotal">,
    currentStock: number
  ) {
    const existing = this.cart.items.find(i => i.product_id === product.product_id);
    const now = new Date();

    if (existing) {
      const newQuantity = existing.quantity + product.quantity;
      if (newQuantity > currentStock) {
        throw new Error("Cantidad supera el stock disponible");
      }
      existing.quantity = newQuantity;
      existing.subtotal = existing.price * existing.quantity;
      existing.updated_at = now;
    } else {
      if (product.quantity > currentStock) {
        throw new Error("Cantidad supera el stock disponible");
      }

      const newItem: CartItem = {
        ...product,
        subtotal: product.price * product.quantity,
        created_at: now,
        updated_at: now,
      };

      this.cart.items.push(newItem);
    }

    this.refreshTotals();
  }

  // 📝 Actualiza la cantidad de un producto existente
  updateQuantity(product_id: number, quantity: number, currentStock: number) {
    const item = this.cart.items.find(i => i.product_id === product_id);
    if (!item) throw new Error("Producto no encontrado en el carrito");
    if (quantity <= 0) throw new Error("Cantidad inválida");
    if (quantity > currentStock) throw new Error("Cantidad supera el stock disponible");

    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    item.updated_at = new Date();
    this.refreshTotals();
  }

  // ❌ Elimina un producto del carrito
  removeItem(product_id: number) {
    this.cart.items = this.cart.items.filter(i => i.product_id !== product_id);
    this.refreshTotals();
  }

  // 🧹 Vacía completamente el carrito
  clear() {
    this.cart.items = [];
    this.cart.total_amount = 0;
    this.cart.updated_at = new Date();
  }

  // ⏳ Verifica si el carrito ha expirado
  checkExpiration() {
    const now = new Date();
    if (this.cart.expires_at && now > this.cart.expires_at) {
      this.cart.status = "expired";
      throw new Error("El carrito ha expirado por inactividad");
    }
  }

  // 🔄 Recalcula totales y extiende expiración
  private refreshTotals() {
    this.cart.total_amount = this.cart.items.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0
    );
    this.cart.updated_at = new Date();
    // ⏰ extiende expiración 24h desde la última actualización
    this.cart.expires_at = new Date(this.cart.updated_at.getTime() + 24 * 60 * 60 * 1000);
  }
}
