// Repositorio MySQL para la entidad Cart
// Implementa la interfaz CartRepository y gestiona todas las operaciones del carrito
// Se conecta directamente con la base de datos MySQL usando el pool definido en config/db.ts

import db from "../../../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Cart, CartItem } from "../../domain/cart.entity";
import { ICartRepository } from "../../infraestructure/repositories/cart.repository";
import { IProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";

export class CartRepository  implements ICartRepository {
  constructor(private productsRepository: IProductsRepository) {}

  // Validar stock o precios antes de agregar un ítem
  async upsertItem(
    cartId: number,
    productId: number,
    quantity: number,
    price: number,
    stockAvailable: number
  ): Promise<void> {

    // Ejemplo de uso: verificar que el producto existe
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new Error("Producto no encontrado");

    await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price, stock_available, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), subtotal = VALUES(subtotal)`,
      [cartId, productId, quantity, price, stockAvailable, quantity * price]
    );
  }

   // Elimina un ítem específico del carrito
  async removeItem(cartId: number, productId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [
      cartId,
      productId,
    ]);
  }

  // Limpia todos los ítems del carrito sin eliminarlo
  async clearItems(cartId: number): Promise<void> {
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
  }

  // Buscar un carrito asociado a un usuario
  // Si no existe, devuelve null
  async findByUser(userId: number): Promise<Cart | null> {
    // Buscar el carrito principal del usuario
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM carts WHERE user_id = ?",
      [userId]
    );

    // Si no se encuentra ningún carrito, se retorna null
    if (!rows || rows.length === 0) return null;

    // Garantizamos que cartRow existe
    const cartRow = rows[0]!;

    // Obtener los ítems del carrito asociado
    const [itemRows] = await db.query<RowDataPacket[]>(
      "SELECT ci.*, p.name FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?",
      [cartRow.id]
    );

    
 
    //Mapeamos las filas de la base de datos a objetos del dominio CartItem
    const items: CartItem[] = itemRows.map((r: RowDataPacket) => ({
      product_id: r.product_id,
      name: r.name,
      quantity: r.quantity,
      price: r.price,
      stock_available: r.stock_available,
      subtotal: r.subtotal,
      added_at: new Date(r.added_at),
      price_locked_until: new Date(r.price_locked_until),
    }));

    // Construimos el objeto del dominio Cart
    const cart: Cart = {
      id: cartRow.id,
      user_id: cartRow.user_id,
      items,
      total_amount: cartRow.total_amount,
      created_at: new Date(cartRow.created_at),
      updated_at: cartRow.updated_at,
      expires_at: cartRow.expires_at,
      status: cartRow.status,
  };

    return cart;
  }

  // Guardar o actualizar un carrito en la base de datos
  // Si el carrito existe, se actualiza; si no, se crea uno nuevo (REPLACE INTO)
  async save(cart: Cart): Promise<void> {
    // Guardamos o reemplazamos el carrito principal
    await db.query<ResultSetHeader>(
      `REPLACE INTO carts (id, user_id, total_amount, updated_at, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cart.id, 
        cart.user_id, 
        cart.total_amount, 
        cart.updated_at, 
        cart.expires_at,
        cart.status,
      ]
    );

    // Eliminar ítems antiguos antes de insertar nuevos
    await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);

    // Guardamos o actualizamos los ítems del carrito
    for (const item of cart.items) {
      await db.query<ResultSetHeader>(
        `REPLACE INTO cart_items 
         (cart_id, product_id, quantity, price, stock_available, subtotal, added_at, price_locked_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cart.id,                    // Relación con el carrito
          item.product_id,            // ID del producto
          item.quantity,              // Cantidad de unidades
          item.price,                 // Precio unitario
          item.stock_available,       // Stock disponible en el momento
          item.subtotal,              // Subtotal (price * quantity)
          item.added_at,              // Fecha en que se agregó
          item.price_locked_until,    // Fecha límite del precio congelado
        ]
      );
    }
  }

  // Eliminar completamente el carrito de un usuario (opcional)
  async deleteCart(userId: number): Promise<void> {
    const [rows]: any = await db.query("SELECT id FROM carts WHERE user_id = ?", [userId]);
    if (rows.length > 0) {
      const cartId = rows[0].id;
      // Primero eliminamos los ítems asociados
      await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    }
    // Luego eliminamos el carrito
    await db.query("DELETE FROM carts WHERE user_id = ?", [userId]);
  }

}
