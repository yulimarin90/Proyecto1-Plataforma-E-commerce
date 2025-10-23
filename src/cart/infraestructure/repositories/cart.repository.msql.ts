import db from "../../../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Cart, CartItem } from "../../domain/cart.entity";
import { ICartRepository } from "../../infraestructure/repositories/cart.repository";
import { IProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";

export class CartRepository implements ICartRepository {
  constructor(private productsRepository: IProductsRepository) {}

  // Buscar producto por ID
  async findProductById(productId: number) {
    const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [productId]);
    return rows[0] || null;
  }

  // Validar si producto está activo y con stock
  async validateProductAvailability(productId: number) {
    const product = await this.findProductById(productId);
    if (!product) throw new Error("Producto no encontrado");
    if (product.status === "inactive") throw new Error("Producto inactivo");
    if (product.status === "discontinued") throw new Error("Producto descontinuado");
    if (product.stock <= 0) throw new Error("Producto sin stock disponible");
    return product;
  }

  async decreaseProductStock(productId: number, quantity: number) {
    await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId]);
  }

  async createOrder(orderData: any): Promise<number> {
    const [result]: any = await db.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, shipping_method, payment_method, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE', NOW(), NOW())`,
      [
        orderData.user_id,
        orderData.total_amount,
        orderData.shipping_address,
        orderData.shipping_method,
        orderData.payment_method,
      ]
    );
    return result.insertId;
  }

  async createOrderItem(item: any) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.order_id, item.product_id, item.quantity, item.unit_price, item.subtotal, item.cart_id,]
      
    );
  }
  

 async markCartAsCheckedOut(cartId: number) {
  await db.query("UPDATE carts SET is_checked_out = 1 WHERE id = ?", [cartId]);
}


  async findOrderById(orderId: number) {
    const [rows]: any = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    return rows[0] || null;
  }

  // Agregar o actualizar un ítem del carrito
  async upsertItem(cartId: number, productId: number, quantity: number, price: number): Promise<void> {
    const product = await this.validateProductAvailability(productId); // 🔍 Validación agregada

    const subtotal = quantity * price;

    await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price, subtotal, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR))
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), subtotal = VALUES(subtotal)`,
      [cartId, productId, quantity, price, subtotal]
    );
  }

  async removeItem(cartId: number, productId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, productId]);
  }

  async clearItems(cartId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
  }

  async findByUser(userId: number): Promise<Cart | null> {
    const [cartRows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM carts WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!cartRows || cartRows.length === 0) return null;

    const cartRow = cartRows[0] as RowDataPacket;

    const [itemsRows] = await db.query<RowDataPacket[]>(
      `SELECT ci.*, p.name 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartRow.id]
    );

    const items: CartItem[] = itemsRows.map((row) => ({
      product_id: row.product_id,
      name: row.name,
      quantity: row.quantity,
      price: Number(row.price),
      subtotal: Number(row.subtotal),
      added_at: row.added_at,
      price_locked_until: row.price_locked_until,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return {
      id: cartRow.id,
      user_id: cartRow.user_id,
      items,
      total_amount: Number(cartRow.total_amount),
      created_at: cartRow.created_at,
      updated_at: cartRow.updated_at,
      expires_at: cartRow.expires_at,
      status: cartRow.status,
    };
  }

  // Crear o actualizar carrito
  async save(cart: Cart): Promise<Cart> {
    if (!cart.id) {
      // Crear carrito nuevo
      const [result]: any = await db.query<ResultSetHeader>(
        `INSERT INTO carts (user_id, total_amount, created_at, updated_at, expires_at, status)
         VALUES (?, ?, NOW(), NOW(), ?, ?)`,
        [cart.user_id, cart.total_amount, cart.expires_at, cart.status]
      );
      cart.id = result.insertId;
    } else {
      // Actualizar carrito existente
      await db.query<ResultSetHeader>(
        `UPDATE carts
         SET total_amount = ?, updated_at = NOW(), expires_at = ?, status = ?
         WHERE id = ?`,
        [cart.total_amount, cart.expires_at, cart.status, cart.id]
      );
    }

    // Limpiar ítems anteriores
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);

    // Insertar los ítems nuevos
    for (const item of cart.items) {
      await db.query<ResultSetHeader>(
        `INSERT INTO cart_items (cart_id, product_id, quantity, price, subtotal, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [cart.id, item.product_id, item.quantity, item.price, item.subtotal]
      );
    }

    return cart; // Retornar el carrito actualizado o creado
  }

  async deleteCart(userId: number): Promise<void> {
    const [rows]: any = await db.query("SELECT id FROM carts WHERE user_id = ?", [userId]);
    if (rows.length > 0) {
      const cartId = rows[0].id;
      await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
      await db.query("DELETE FROM carts WHERE id = ?", [cartId]);
    }
  }

  async updateStatus(cartId: number, status: string): Promise<void> {
    await db.query("UPDATE carts SET status = ?, updated_at = NOW() WHERE id = ?", [status, cartId]);
  }

  async delete(cartId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    await db.query("DELETE FROM carts WHERE id = ?", [cartId]);
  }
}
