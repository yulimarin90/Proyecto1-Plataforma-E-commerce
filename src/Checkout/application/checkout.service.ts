// src/checkout/application/checkout.service.ts
import { CheckoutRepository } from "../infraestructure/repositories/checkout.repository";
import { OrdersService } from "../../Orders/application/order.service";
import { CartService } from "../../cart/application/cart.service";
import { CartRepository } from "../../cart/infraestructure/repositories/cart.repository.msql";
import { ProductsRepository } from "../../Products/infraestructure/repositories/products.repository";

export class CheckoutService {
  private checkoutRepo = new CheckoutRepository();
  private ordersService = new OrdersService();
  private cartService = new CartService(new CartRepository(new ProductsRepository()));
  
  async processCheckout(checkoutData: any) {
    const { userId, products, shipping_address, payment_method } = checkoutData;

    // Validaciones iniciales
    if (!userId) throw { 
      status: 400, message: "El usuario es obligatorio" 
    };

    // Obtener productos del carrito si no se envían
    let finalProducts = products;
    if (!products || products.length === 0) {
      const cart = await this.cartService.getCart(userId);
      if (!cart || cart.items.length === 0) {
        throw { status: 400, message: "El carrito está vacío" };
      }

      finalProducts = cart.items.map(item => ({
        id: item.product_id,
        quantity: item.quantity
      }));
    }
    
    // Validación de dirección
    if (!shipping_address || shipping_address.trim().length < 10) {
      throw { status: 400, message: "La dirección de envío debe ser completa y válida" };
    }

    // Validación de método de pago
    if (!payment_method || payment_method.trim() === "") {
      throw { status: 400, message: "El método de pago es obligatorio" };
    }

    let subtotal = 0;
    const productsForOrder: any[] = [];

    // --- Validar cada producto y armar array compatible con OrdersService ---
    for (const item of finalProducts) {
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

      //Enviar con "id" que OrdersService espera
      productsForOrder.push({
        id: product.id,
        quantity,
        price,
        subtotal: subtotalItem
      });
    }

    // --- Calcular shipping y total ---
    // Usar la misma unidad que los precios de los productos (tests esperan 10 de envío)
    // Si el subtotal es mayor o igual a 500 (por ejemplo), envío gratis.
    const isLocal = shipping_address.toLowerCase().includes("Medellín");
    const shippingCost = subtotal >= 50000 ? 0 : isLocal ? 10000 : 20000;

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

    // Reducir stock
    for (const item of productsForOrder) {
      await this.checkoutRepo.reduceStock(item.id, item.quantity);
    }
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