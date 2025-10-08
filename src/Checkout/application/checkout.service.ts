// src/checkout/checkout.service.ts

import { CheckoutRepository } from "../infraestructure/repositories/checkout.repository";
import { Order, OrderProduct } from "../domain/checkout.entity";

export class CheckoutService {
  static async processCheckout(data: any) {
    const { cartId, paymentMethod, shippingAddress, userId } = data;

    if (!cartId || !paymentMethod || !shippingAddress) {
      throw new Error("Datos incompletos para procesar la orden");
    }

    // Simulación de cálculo total
    const total = Math.floor(Math.random() * 500000) + 10000;

    const order: Order = {
      userId,
      total,
      paymentMethod,
      shippingAddress,
      status: "created"
    };

    const orderId = await CheckoutRepository.createOrder(order);

    return { message: "Orden creada exitosamente", orderId };
  }

  static async getOrders(userId: number) {
    return await CheckoutRepository.findOrdersByUser(userId);
  }

  static async getOrderById(orderId: number) {
    const order = await CheckoutRepository.findOrderById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    return order;
  }

  static async confirmStock(orderId: number, products: any[]) {
    const stockInsuficiente = products.find(p => p.quantity > 10); // simula límite de stock
    if (stockInsuficiente) {
      throw new Error("Stock insuficiente para uno o más productos");
    }
    await CheckoutRepository.updateOrderStatus(orderId, "confirmed");
    return { message: "Orden confirmada exitosamente" };
  }
}
