// src/checkout/checkout.repository.ts
import  db  from "../../../config/db";
import { Order, OrderProduct } from "../../domain/checkout.entity";

export class CheckoutRepository {
  static async createOrder(order: Order): Promise<number> {
    const [result] = await db.query(
      "INSERT INTO orders (user_id, total, payment_method, shipping_address, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [order.userId, order.total, order.paymentMethod, order.shippingAddress, "pending"]
    );
    // @ts-ignore
    return result.insertId;
  }

  static async addProductsToOrder(orderProducts: OrderProduct[]): Promise<void> {
    const values = orderProducts.map(p => [p.orderId, p.productId, p.quantity, p.price]);
    await db.query(
      "INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ?",
      [values]
    );
  }

  static async findOrderById(orderId: number) {
    const [rows] = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    // @ts-ignore
    return rows[0];
  }

  static async findOrdersByUser(userId: number) {
    const [rows] = await db.query("SELECT * FROM orders WHERE user_id = ?", [userId]);
    return rows;
  }

  static async updateOrderStatus(orderId: number, status: string) {
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
  }
}
