// src/Cart/infraestructure/repositories/cart.repository.msql.ts
import  db  from "../../../config/db";
import { Cart, NewCart } from "../../domain/cart.entity";
import { CartRepository } from "./cart.repository";

export class CartRepositoryMySQL implements CartRepository {
  async findByUser(userId: string): Promise<Cart | null> {
    const [rows]: any = await db.query(
      "SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (!rows.length) return null;

    const cartRow = rows[0];

    // obtener items del carrito
    const [items]: any = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = ?",
      [cartRow.id]
    );

    return {
      id: cartRow.id,
      user_id: cartRow.user_id,
      items: items.map((i: any) => ({
        product_id: i.product_id,
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
        stock_available: i.stock_available,
        added_at: i.added_at,
        price_locked_until: i.price_locked_until,
        subtotal: Number(i.subtotal),
      })),
      total_amount: Number(cartRow.total_amount),
      created_at: cartRow.created_at,
      updated_at: cartRow.updated_at,
      expires_at: cartRow.expires_at,
      status: cartRow.status,
    };
  }

 async save(cart: NewCart | Cart): Promise<void> {
  if (!("id" in cart) || cart.id === 0) {
    // crear carrito nuevo
    const [result]: any = await db.query(
      "INSERT INTO carts (user_id, total_amount, created_at, updated_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        cart.user_id,
        cart.total_amount || 0,
        cart.created_at,
        cart.updated_at,
        cart.expires_at,
        cart.status,
      ]
    );
    (cart as Cart).id = result.insertId;
  } else {
    // actualizar carrito existente
    await db.query(
      "UPDATE carts SET total_amount = ?, updated_at = ?, expires_at = ?, status = ? WHERE id = ?",
      [cart.total_amount, cart.updated_at, cart.expires_at, cart.status, cart.id]
    );

    // eliminar items antiguos y volver a insertar
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);
  }

  // 🧾 Validar e insertar items actualizados
  for (const item of cart.items) {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    const subtotal = Number(item.subtotal);

    if (
      isNaN(price) ||
      isNaN(quantity) ||
      isNaN(subtotal) ||
      !item.product_id ||
      !item.name
    ) {
      console.error("❌ Error: datos inválidos en item del carrito", item);
      throw new Error("Datos inválidos en item del carrito");
    }

    await db.query(
      "INSERT INTO cart_items (cart_id, product_id, name, price, quantity, stock_available, added_at, price_locked_until, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        (cart as Cart).id,
        item.product_id,
        item.name,
        price,
        quantity,
        item.stock_available,
        item.added_at,
        item.price_locked_until,
        subtotal,
      ]
    );
  }
}


  async delete(cartId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    await db.query("DELETE FROM carts WHERE id = ?", [cartId]);
  }
}
