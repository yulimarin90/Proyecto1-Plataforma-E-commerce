
import db from "../../../config/db";
import {Order} from "../../domain/order.entity"

export interface IOrdersRepository {
  
  createOrder(orderData: any): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrderById(orderId: number): Promise<Order | null>;
  cancelOrder(orderId: number, reason: string): Promise<boolean>;
  assignTracking(orderId: number, trackingData: any): Promise<boolean>;
  getAllOrders(): Promise<Order[]>;
}
export class OrdersRepository {
  // Crear una nueva orden
  async createOrder(orderData: any) {
    
    const [result]: any = await db.query(
      `INSERT INTO orders 
        (order_number, user_id, total_amount, status, shipping_address, payment_method, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderData.order_number,
        orderData.userId,
        orderData.total_amount,
        orderData.status,
        orderData.shipping_address,
        orderData.payment_method
      ]
    );

    const orderId = result.insertId;

    // Insertar productos asociados
    if (orderData.products && orderData.products.length > 0) {
      for (const product of orderData.products) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, product.product_id, product.quantity, product.price, product.subtotal]
        );

        // descontar stock
        await db.query(
          `UPDATE products 
             SET stock = stock - ? 
           WHERE id = ? AND stock >= ?`,
          [product.quantity, product.product_id, product.quantity]
        );
      }
    }

    return { id: orderId, ...orderData };
  }

  //Obtener órdenes por usuario
  async getOrdersByUser(userId: number) {
    const [rows]: any = await db.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  // Obtener orden por ID con productos
  async getOrderById(orderId: number) {
    const [rows]: any = await db.query(
      `SELECT o.*, 
              oi.product_id, oi.quantity, oi.price, oi.subtotal,
              p.name AS product_name
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (rows.length === 0) return null;

    const order = {
      id: rows[0].id,
      order_number: rows[0].order_number,
      user_id: rows[0].user_id,
      total_amount: rows[0].total_amount,
      status: rows[0].status,
      shipping_address: rows[0].shipping_address,
      payment_method: rows[0].payment_method,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
      products: rows
        .filter((row: any) => row.product_id)
        .map((row: any) => ({
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price,
          subtotal: row.subtotal
        }))
    };

    return order;
  }

  // Cancelar orden (devuelve stock y cambia estado)
  async cancelOrder(orderId: number, reason: string) {
    
    const [items]: any = await db.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    // Devolver stock
    for (const item of items) {
      await db.query(
        `UPDATE products SET stock = stock + ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Cambiar estado de la orden
    const [updateResult]: any = await db.query(
      `UPDATE orders 
       SET status = 'CANCELADO', 
           cancellation_reason = ?, 
           updated_at = NOW() 
       WHERE id = ? AND status = 'PENDIENTE'`,
      [reason, orderId]
    );

    return updateResult.affectedRows > 0;
  }

  // Asignar tracking
  async assignTracking(orderId: number, trackingData: any) {
    const [result]: any = await db.query(
      `UPDATE orders 
       SET tracking_number = ?, 
           carrier = ?, 
           status = 'ENVIADO', 
           updated_at = NOW()
       WHERE id = ?`,
      [trackingData.numeroGuia, trackingData.transportadora, orderId]
    );
    return result.affectedRows > 0;
  }

  // obtener todas las órdenes
  async getAllOrders() {
    const [rows]: any = await db.query(
      `SELECT * FROM orders ORDER BY created_at DESC`
    );
    return rows;
  }
}
