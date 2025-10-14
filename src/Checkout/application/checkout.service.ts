// src/checkout/application/checkout.service.ts
import { CheckoutRepository } from "../infraestructure/repositories/checkout.repository";
import { OrdersService } from "../../Orders/application/order.service";

export class CheckoutService {
  private checkoutRepo: CheckoutRepository;
  private ordersService: OrdersService;

  constructor() {
    this.checkoutRepo = new CheckoutRepository();
    this.ordersService = new OrdersService();
  }

  async processCheckout(checkoutData: any) {
    const { userId, products, shipping_address, payment_method } = checkoutData;

    // --- Validaciones iniciales ---
    if (!userId) {
      throw { status: 400, message: "El usuario es obligatorio" };
    }
    if (!products || products.length === 0) {
      throw { status: 400, message: "No hay productos en el carrito" };
    }
    if (!shipping_address || shipping_address.trim() === "") {
      throw { status: 400, message: "La dirección de envío es obligatoria" };
    }
    if (!payment_method || payment_method.trim() === "") {
      throw { status: 400, message: "El método de pago es obligatorio" };
    }

    let subtotal = 0;
    const productsForOrder: any[] = [];

    // --- Validar cada producto y armar array compatible con OrdersService ---
    for (const item of products) {
      const product = await this.checkoutRepo.getProductById(item.id);
      if (!product) {
        throw { status: 404, message: `Producto ${item.id} no encontrado` };
      }

      const price = Number(product.price);
      const quantity = Number(item.quantity);

      if (isNaN(price) || isNaN(quantity) || quantity <= 0) {
        throw { status: 400, message: `Cantidad o precio inválido para ${product.name}` };
      }
      if (product.stock < quantity) {
        throw { status: 400, message: `Stock insuficiente para ${product.name}` };
      }

      const subtotalItem = parseFloat((price * quantity).toFixed(2));
      subtotal += subtotalItem;

      // ⚡ Enviar con "id" que OrdersService espera
      productsForOrder.push({
        id: product.id,
        quantity,
        price,
        subtotal: subtotalItem
      });
    }

    // --- Calcular shipping y total ---
    const shippingCost = subtotal >= 50000 ? 0 : 10000;
    const total_amount = parseFloat((subtotal + shippingCost).toFixed(2));

    if (isNaN(total_amount)) {
      throw { status: 500, message: "Error calculando total del checkout" };
    }

    // --- Payload para crear la orden ---
    const orderPayload = {
      userId,
      shipping_address,
      payment_method,
      products: productsForOrder
    };

    // --- Crear la orden ---
    const order = await this.ordersService.createOrder(orderPayload);

    // --- Retorno al cliente ---
    return {
      message: "Checkout completado correctamente",
      order,
      resumen: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost,
        total: total_amount
      }
    };
  }
}
