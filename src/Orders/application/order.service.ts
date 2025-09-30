// orders.service.ts
import { OrdersRepository } from "../infraestructure/repositories/order.repository";

export class OrdersService {
  private repo: OrdersRepository;

  constructor() {
    this.repo = new OrdersRepository(); // Instancia normal
  }

  async createOrder(orderData: any) {
    if (!orderData.userId || !orderData.products?.length) {
      throw { status: 400, message: "Datos incompletos" };
    }
    return await this.repo.createOrder(orderData);
  }

  async getOrdersByUser(userId: string) {
    return await this.repo.getOrdersByUser(userId);
  }

  async getOrderById(orderId: string) {
    const order = await this.repo.getOrderById(orderId);
    if (!order) throw { status: 404, message: "Orden no encontrada" };
    return order;
  }

  async cancelOrder(orderId: string, reason: string) {
    const order = await this.repo.getOrderById(orderId);
    if (!order) throw { status: 404, message: "Orden no encontrada" };
    if (order.status === "shipped" || order.status === "completed") {
      throw { status: 400, message: "La orden no puede cancelarse" };
    }
    return await this.repo.cancelOrder(orderId, reason);
  }

  async assignTracking(orderId: string, trackingData: any) {
    if (!trackingData.numeroGuia || !trackingData.transportadora) {
      throw { status: 400, message: "Datos de tracking incompletos" };
    }
    return await this.repo.assignTracking(orderId, trackingData);
  }

  async getAllOrders() {
    return await this.repo.getAllOrders();
  }
}