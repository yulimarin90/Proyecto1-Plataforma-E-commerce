import { ICartRepository } from "../infraestructure/repositories/cart.repository";
import { Cart, CartItem } from "../domain/cart.entity";
import { CartOperations } from "../domain/cart.operations";

export class CartService {
  constructor(private repository: ICartRepository) {}

  // 🛒 Obtener carrito existente o crear uno nuevo
  async getCart(userId: number): Promise<Cart> {
    let cart = await this.repository.findByUser(userId);

    if (!cart) {
      cart = {
        id: 0,
        user_id: userId,
        items: [],
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "active",
      };
      await this.repository.save(cart);
    }

    const operations = new CartOperations(cart);
    operations.checkExpiration();

    return cart;
  }

  // ➕ Agregar producto al carrito
  async addItem(
    userId: number,
    product: Omit<CartItem, "added_at" | "price_locked_until" | "subtotal">,
    currentStock: number
    
  ) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    // Validar expiración
    operations.checkExpiration();

    // Lógica de negocio para agregar producto
    operations.addItem(product,currentStock);

    // Persistir cambios en base de datos
    await this.repository.save(cart);

    return cart;
  }

  async saveCart(cart: Cart) {
  await this.repository.save(cart); }

  // 🧮 Actualizar cantidad
  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    currentStock: number
  ) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.checkExpiration();
    operations.updateQuantity(productId, quantity, currentStock);

    await this.repository.save(cart);
    return cart;
  }

  // 🗑️ Eliminar ítem
 async removeItem(userId: number, productId: number) {
  const cart = await this.getCart(userId);
  const operations = new CartOperations(cart);

  // ✅ Verificar si el carrito está vacío
  if (!cart.items || cart.items.length === 0) {
    throw new Error("El carrito está vacío, no hay productos por eliminar");
  }

  // ✅ Verificar si el producto existe en el carrito
  const itemExists = cart.items.some(item => item.product_id === productId);
  if (!itemExists) {
    throw new Error("El producto no existe en el carrito");
  }

  operations.checkExpiration();
  operations.removeItem(productId);

  await this.repository.save(cart);
  return cart;
}

  // 🧼 Vaciar carrito
async clearCart(userId: number) {
  const cart = await this.getCart(userId);
  const operations = new CartOperations(cart);

  // 🚨 Validar si ya está vacío
  if (!cart.items || cart.items.length === 0) {
    throw new Error("El carrito ya está vacío");
  }

  operations.clear();
  await this.repository.save(cart);
}


  // 🧾 Checkout
  async checkout(
    userId: number,
    shipping_address: string,
    payment_method: string
  ) {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.checkExpiration();

    if (cart.items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    // Validar stock en tiempo real
    for (const item of cart.items) {
      const product = await this.repository.findProductById(item.product_id);
      if (!product) {
        throw new Error(`Producto con ID ${item.product_id} no existe`);
      }
      if (item.quantity > product.stock) {
        throw new Error(`Stock insuficiente para el producto ${product.name}`);
      }
    }

    // Crear orden y mover productos
    const orderId = await this.repository.createOrder({
      user_id: userId,
      cart_id: cart.id,
      total_amount: cart.total_amount,
      shipping_address,
      payment_method,
      status: "PENDIENTE",
    });

    for (const item of cart.items) {
      await this.repository.createOrderItem({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      });

      await this.repository.decreaseProductStock(item.product_id, item.quantity);
    }

    await this.repository.markCartAsCheckedOut(cart.id);
    return this.repository.findOrderById(orderId);
  }
}
