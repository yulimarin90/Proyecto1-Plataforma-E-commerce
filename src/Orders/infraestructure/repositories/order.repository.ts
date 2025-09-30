// En ../infraestructure/repositories/order.repository.ts
import db from "../../../config/db";

export class OrdersRepository {
  // Crear una nueva orden
  async createOrder(orderData: any) {
    const [result]: any = await db.query(
      `INSERT INTO orders 
        (user_id, total, status, shipping_address, payment_method, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderData.userId,
        orderData.total,
        orderData.status || 'pending',
        orderData.shippingAddress,
        orderData.paymentMethod,
      ]
    );
    
    // Insertar productos de la orden
    if (orderData.products && orderData.products.length > 0) {
      for (const product of orderData.products) {
        await db.query(
          `INSERT INTO order_items 
            (order_id, product_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [result.insertId, product.id, product.quantity, product.price]
        );
      }
    }
    
    return { id: result.insertId, ...orderData };
  }

  // Obtener órdenes por usuario
  async getOrdersByUser(userId: string) {
    const [rows]: any = await db.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  // Obtener orden por ID
  async getOrderById(orderId: string) {
    const [rows]: any = await db.query(
      `SELECT o.*, 
              oi.product_id, oi.quantity, oi.price,
              p.nombre as product_name
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (rows.length === 0) return null;

    // Estructurar la respuesta
    const order = {
      ...rows[0],
      products: rows.map((row: any) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        price: row.price
      })).filter((product: any) => product.product_id) // Filtrar productos nulos
    };

    return order;
  }

  // Cancelar orden
  async cancelOrder(orderId: string, reason: string) {
    const [result]: any = await db.query(
      `UPDATE orders 
       SET status = 'cancelled', cancellation_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [reason, orderId]
    );
    return result.affectedRows > 0;
  }

  // Asignar tracking
  async assignTracking(orderId: string, trackingData: any) {
    const [result]: any = await db.query(
      `UPDATE orders 
       SET tracking_number = ?, carrier = ?, status = 'shipped', updated_at = NOW()
       WHERE id = ?`,
      [trackingData.numeroGuia, trackingData.transportadora, orderId]
    );
    return result.affectedRows > 0;
  }

  // Obtener todas las órdenes
  async getAllOrders() {
    const [rows]: any = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    return rows;
  }
}