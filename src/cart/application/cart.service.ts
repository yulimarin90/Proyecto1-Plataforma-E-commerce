import { ICartRepository } from "../infraestructure/repositories/cart.repository";
import { Cart, CartItem } from "../domain/cart.entity";
import { CartOperations } from "../domain/cart.operations";

export class CartService {
  constructor(private repository: ICartRepository) {}

  /** 🛒 Obtener carrito activo o crear uno nuevo */
  async getCart(userId: number): Promise<Cart> {
    let cart = await this.repository.findByUser(userId);

    if (cart) {
      // 🕐 Verificar expiración
      if (cart.expires_at && new Date() > new Date(cart.expires_at)) {
        console.log("⚠️ Carrito expirado. Creando uno nuevo...");
        // Marcar como expirado
        await this.repository.updateStatus(cart.id, "expired");

        //Eliminar el carrito viejo (junto con ítems)
        await this.repository.delete(cart.id);

        // Crear nuevo carrito activo
        const newCart: Cart = {
          id: 0,
          user_id: userId,
          items: [],
          total_amount: 0,
          created_at: new Date(),
          updated_at: new Date(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          status: "active",
        };

        const saved = await this.repository.save(newCart);
        console.log("🆕 Nuevo carrito creado tras expiración");
        return saved;
      }

      return cart;
    }

    // 🆕 Si no existe ninguno, crear uno nuevo
    const newCart: Cart = {
      id: 0,
      user_id: userId,
      items: [],
      total_amount: 0,
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "active",
    };

    const saved = await this.repository.save(newCart);
    return saved;
  }

  /** 🧮 Agregar producto al carrito */
  async addItem(
    userId: number,
    product: Omit<CartItem, "subtotal">,
    currentStock: number
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    // Validar expiración
    operations.checkExpiration();

    // Agregar producto (CartOperations maneja stock y cantidad)
    operations.addItem(product, currentStock);

    // Persistir
    await this.repository.save(cart);
    return cart;
  }

  /** 💾 Guardar carrito (manual) */
  async saveCart(cart: Cart) {
    await this.repository.save(cart);
  }

  /** 🔄 Actualizar cantidad */
  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    currentStock: number
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    operations.checkExpiration();
    operations.updateQuantity(productId, quantity, currentStock);

    await this.repository.save(cart);
    return cart;
  }

  /** 🗑️ Eliminar ítem */
  async removeItem(userId: number, productId: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    if (!cart.items || cart.items.length === 0)
      throw new Error("El carrito está vacío, no hay productos por eliminar");

    const itemExists = cart.items.some((item) => item.product_id === productId);
    if (!itemExists) throw new Error("El producto no existe en el carrito");

    operations.checkExpiration();
    operations.removeItem(productId);

    await this.repository.save(cart);
    return cart;
  }

  /** 🧼 Vaciar carrito */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.getCart(userId);
    const operations = new CartOperations(cart);

    if (!cart.items || cart.items.length === 0)
      throw new Error("El carrito ya está vacío");

    operations.clear();
    await this.repository.save(cart);
  }

  /** 🧾 Checkout */
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
      if (!product) throw new Error(`Producto ${item.product_id} no existe`);
      if (item.quantity > product.stock)
        throw new Error(`Stock insuficiente para ${product.name}`);
    }

    // Crear orden
    const orderId = await this.repository.createOrder({

      user_id: userId,
      cart_id: cart.id,
      total_amount: cart.total_amount,
      shipping_address,
      payment_method,
      status: "PENDIENTE",
    });

    // Insertar ítems
    for (const item of cart.items) {
      await this.repository.createOrderItem({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      });

      await this.repository.decreaseProductStock(item.product_id, item.quantity);
      await this.repository.markCartAsCheckedOut(cart.id);
    }

    await this.repository.markCartAsCheckedOut(cart.id);
    return this.repository.findOrderById(orderId);
  }
}
