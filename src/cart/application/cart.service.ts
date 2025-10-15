// src/Cart/application/cart.service.ts

import { ICartRepository } from "../infraestructure/repositories/cart.repository";
import { Cart, CartItem } from "../domain/cart.entity";
import { CartOperations } from "../domain/cart.operations";

export class CartService {
  constructor(private repository: ICartRepository) {}

  // Obtener carrito o crearlo si no existe
  async getCart(userId: number): Promise<Cart> {
    let cart = await this.repository.findByUser(userId);
    if (!cart) {
      cart = {
        id: 0,
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "active",
      };
      await this.repository.save(cart);
    }

    this.checkExpiration(cart);
    return cart;
  }

  // ➕ Agregar producto al carrito
  async addItem(
  userId: number,
  product: Omit<CartItem, "added_at" | "price_locked_until" | "subtotal">
) {
  // Validaciones iniciales
  if (!product.product_id || typeof product.product_id !== "number") {
    throw new Error("El ID del producto no es válido");
  }

  if (product.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0");
  }

  if (product.price <= 0) {
    throw new Error("El precio debe ser mayor a 0");
  }

  if (product.stock_available < product.quantity) {
    throw new Error("Cantidad supera el stock disponible");
  }

  // Obtener carrito del usuario
  const cart = await this.getCart(userId);
  const existing = cart.items.find(i => i.product_id === product.product_id);
  const now = new Date();

  if (existing) {
    // Si ya existe el producto en el carrito → aumentar cantidad
    const newQuantity = existing.quantity + product.quantity;

    if (newQuantity > existing.stock_available) {
      throw new Error("Cantidad supera el stock disponible");
    }

    existing.quantity = newQuantity;
    existing.subtotal = Number((existing.price * existing.quantity).toFixed(2));
  } else {
    // Si es un nuevo producto → crear ítem nuevo
    const lockedUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h

    const newItem: CartItem = {
      product_id: Number(product.product_id),
      name: product.name,
      quantity: Number(product.quantity),
      price: Number(product.price),
      stock_available: Number(product.stock_available),
      added_at: now,
      price_locked_until: lockedUntil,
      subtotal: Number((product.price * product.quantity).toFixed(2)),
    };

    cart.items.push(newItem);
  }

  // Recalcular totales
  this.refreshTotals(cart);

  // Guardar cambios en BD
  await this.repository.save(cart);

  return cart;
}


  // ✍️ Actualizar cantidad de un producto existente
  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    currentStock: number
  ) {
    const cart = await this.getCart(userId);
    const item = cart.items.find(i => i.product_id === productId);

    if (!item) throw new Error("Producto no encontrado en el carrito");
    if (quantity <= 0) throw new Error("Cantidad inválida");
    if (quantity > currentStock) throw new Error("Cantidad supera el stock disponible");

    item.quantity = quantity;
    item.subtotal = item.price * quantity;

    this.refreshTotals(cart);
    await this.repository.save(cart);
    return cart;
  }

  // 🗑️ Eliminar un producto
  async removeItem(userId: number, productId: number) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter(i => i.product_id !== productId);

    this.refreshTotals(cart);
    await this.repository.save(cart);
    return cart;
  }

  // 🧹 Vaciar carrito
  async clearCart(userId: number) {
    const cart = await this.getCart(userId);
    cart.items = [];
    cart.total_amount = 0;
    cart.updated_at = new Date();

    await this.repository.save(cart);
  }

  // 🕒 Verificar expiración del carrito
  private checkExpiration(cart: Cart) {
    const now = new Date();
    if (cart.expires_at && now > cart.expires_at) {
      cart.status = "expired";
      throw new Error("El carrito ha expirado por inactividad");
    }
  }

  // 🧮 Recalcular totales y actualizar fechas
  private refreshTotals(cart: Cart) {
    cart.total_amount = cart.items.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0
    );
    cart.updated_at = new Date();
    cart.expires_at = new Date(cart.updated_at.getTime() + 24 * 60 * 60 * 1000);
  }
}