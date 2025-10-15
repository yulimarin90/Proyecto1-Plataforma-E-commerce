import { Cart, CartItem } from "./cart.entity";

export class CartOperations {
  constructor(public cart: Cart) {}

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

      const lockedUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const newItem: CartItem = {
        ...product,
        added_at: now,
        price_locked_until: lockedUntil,
        subtotal: product.price * product.quantity,
      };
      this.cart.items.push(newItem);
    }

    this.refreshTotals();
  }

  updateQuantity(product_id: number, quantity: number, currentStock: number) {
    const item = this.cart.items.find(i => i.product_id === product_id);
    if (!item) throw new Error("Producto no encontrado en el carrito");
    if (quantity <= 0) throw new Error("Cantidad inválida");
    if (quantity > currentStock) throw new Error("Cantidad supera el stock disponible");

    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    this.refreshTotals();
  }

  removeItem(product_id: number) {
    this.cart.items = this.cart.items.filter(i => i.product_id !== product_id);
    this.refreshTotals();
  }

  clear() {
    this.cart.items = [];
    this.cart.total_amount = 0;
    this.cart.updated_at = new Date();
  }

  checkExpiration() {
    const now = new Date();
    if (this.cart.expires_at && now > this.cart.expires_at) {
      this.cart.status = "expired";
      throw new Error("El carrito ha expirado por inactividad");
    }
  }

  private refreshTotals() {
    this.cart.total_amount = this.cart.items.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0
    );
    this.cart.updated_at = new Date();
    this.cart.expires_at = new Date(this.cart.updated_at.getTime() + 24 * 60 * 60 * 1000);
  }
}
