import { OrdersRepository } from "../infraestructure/repositories/order.repository";
import { sendOrderConfirmationEmail } from "../utils/email.service";

export class OrdersService {
  private repo: OrdersRepository;

  constructor() {
    this.repo = new OrdersRepository();
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `ORD-${yyyymmdd}-${random}`;
  }

  async createOrder(orderData: any) {
    if (!orderData.userId || !orderData.products?.length) {
      throw { status: 400, message: "Datos incompletos" };
    }
     
      // Calcular el total
    const totalAmount = orderData.products.reduce((acc: number, product: any) => {
    const subtotal = product.price * product.quantity;
    return acc + subtotal;
  }, 0);

  //preparar datos para la creación de la orden
  orderData.order_number = this.generateOrderNumber();
  orderData.status = "PENDIENTE";
  orderData.total_amount = totalAmount.toFixed(2); 
  orderData.products = orderData.products.map((p: any) => ({
    product_id: p.id,  
    price: p.price,
    quantity: p.quantity,
    subtotal: (p.price * p.quantity).toFixed(2)
  }));

  // Asegurar que shipping_method y notes estén presentes aunque sean opcionales
  orderData.shipping_method = orderData.shipping_method || null;
  orderData.notes = orderData.notes || null;

  // Crear orden en la base de datos
  const order = await this.repo.createOrder(orderData);

  // Enviar email de confirmación
  const userEmail = orderData.userEmail || "cliente@ejemplo.com"; //se puede ajustar
  await sendOrderConfirmationEmail(userEmail, orderData.order_number);

  return order;

  }
  
  async getOrdersByUser(userId: number) {
    return await this.repo.getOrdersByUser(userId);
  }
  
  async getOrderById(orderId: number) {
    const order = await this.repo.getOrderById(orderId);
    if (!order) throw { status: 404, message: "Orden no encontrada" };
    return order;
  }

  async cancelOrder(orderId: number, reason: string) {
    const order = await this.repo.getOrderById(orderId);
    if (!order) throw { status: 404, message: "Orden no encontrada" };

    if (order.status !== "PENDIENTE") {
      throw { status: 400, message: "Solo se pueden cancelar órdenes pendientes" };
    }

    if (order.status === "shipped" || order.status === "completed") {
      throw { status: 400, message: "La orden no puede cancelarse" };
    }

    return await this.repo.cancelOrder(orderId, reason);
  }

  async assignTracking(orderId: number, trackingData: any) {
    if (!trackingData.numeroGuia || !trackingData.transportadora) {
      throw { status: 400, message: "Datos de tracking incompletos" };
    }
    return await this.repo.assignTracking(orderId, trackingData);
  }

  async getAllOrders() {
    return await this.repo.getAllOrders();
  }

  
}
