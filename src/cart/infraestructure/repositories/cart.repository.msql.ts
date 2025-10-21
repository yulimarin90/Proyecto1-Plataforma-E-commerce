import db from "../../../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Cart, CartItem } from "../../domain/cart.entity";
import { ICartRepository } from "../../infraestructure/repositories/cart.repository";
import { IProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";

export class CartRepository implements ICartRepository {
  constructor(private productsRepository: IProductsRepository) {}

  // ✅ Buscar producto por ID (para validaciones)
  async findProductById(productId: number) {
    const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [productId]);
    return rows[0] || null;
  }

  // ✅ Disminuir stock al confirmar el carrito
  async decreaseProductStock(productId: number, quantity: number) {
    await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId]);
  }

  // ✅ Crear una orden al hacer checkout
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

  // ✅ Insertar cada ítem del carrito en la tabla order_items
  async createOrderItem(item: any) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [item.order_id, item.product_id, item.quantity, item.unit_price, item.subtotal]
    );
  }

  // ✅ Cambiar estado del carrito cuando pasa a checkout
  async markCartAsCheckedOut(cartId: number) {
    await db.query("UPDATE carts SET status = 'checked_out' WHERE id = ?", [cartId]);
  }

  // ✅ Buscar orden por ID (para confirmación o tracking)
  async findOrderById(orderId: number) {
    const [rows]: any = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    return rows[0] || null;
  }

  // ✅ Agregar o actualizar un ítem del carrito
  async upsertItem(cartId: number, productId: number, quantity: number, price: number): Promise<void> {
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new Error("Producto no encontrado");

    const subtotal = quantity * price;

    await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price, subtotal, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR))
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), subtotal = VALUES(subtotal)`,
      [cartId, productId, quantity, price, subtotal]
    );
  }

  // ✅ Elimina un ítem específico del carrito
  async removeItem(cartId: number, productId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [
      cartId,
      productId,
    ]);
  }

  // ✅ Limpia todos los ítems del carrito
  async clearItems(cartId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
  }

  
  // ✅ Buscar un carrito por usuario
async findByUser(userId: number): Promise<Cart | null> {
  // 1️⃣ Buscar carrito base
  const [cartRows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM carts WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  // ⛔ Si no hay carrito, retornar null
  if (!cartRows || cartRows.length === 0) {
    return null;
  }

  // ✅ Aquí TS ya sabe que hay al menos 1 resultado
  const cartRow = cartRows[0] as RowDataPacket;

  // 2️⃣ Buscar ítems del carrito
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

  // 3️⃣ Retornar carrito construido ✅
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


  async save(cart: Cart): Promise<void> {
    // Si el carrito no existe aún, no se intenta guardar
    if (!cart || !cart.id) return;

    // 🧹 1. Eliminar ítems anteriores
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);

    // 📝 2. Guardar cada ítem
    for (const item of cart.items) {
      await db.query<ResultSetHeader>(
        `INSERT INTO cart_items
         (cart_id, product_id, quantity, price, subtotal, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cart.id,
          item.product_id,
          item.quantity,
          item.price,
          item.subtotal,
          item.created_at,
          item.updated_at,
        ]
      );
    }

    // 🛒 3. Actualizar info general del carrito
    await db.query<ResultSetHeader>(
      `UPDATE carts
       SET total_amount = ?, updated_at = NOW(), expires_at = ?
       WHERE id = ?`,
      [cart.total_amount, cart.expires_at, cart.id]
    );
  }

  // ✅ Eliminar carrito completo
  async deleteCart(userId: number): Promise<void> {
    const [rows]: any = await db.query("SELECT id FROM carts WHERE user_id = ?", [userId]);
    if (rows.length > 0) {
      const cartId = rows[0].id;
      await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
      await db.query("DELETE FROM carts WHERE id = ?", [cartId]);
    }
  }
}
