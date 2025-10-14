/* Controlador CART
Adaptador entre Express y la capa de aplicación.
Gestiona las solicitudes HTTP y traduce los resultados o errores
a respuestas HTTP estandarizadas.
*/

import { Request, Response } from "express";
import { CartService } from "../../application/cart.service";
import { CartRepositoryMySQL } from "../repositories/cart.repository.msql";
import { ProductRepositoryMySQL } from "../repositories/product.repository.msql"; // ✅ import para verificar stock

// Instancias del servicio y repositorios
const repository = new CartRepositoryMySQL();
const productRepository = new ProductRepositoryMySQL(); // ✅ instancia del repositorio de productos
const service = new CartService(repository);

export class CartController {
  // 🛒 Obtener carrito actual del usuario
  // GET /cart
  async viewCart(req: Request, res: Response) {
    const userId = Number(req.headers["x-user-id"]);
    try {
      const cart = await service.getCart(userId);
      res.status(200).json(cart);
    } catch {
      res.status(401).json({ error: "Usuario no autenticado" });
    }
  }

  // ➕ Agregar producto al carrito
  // POST /cart/items
  async addItem(req: Request, res: Response) {
  try {
    const { productId, cantidad } = req.body;
    const userId = Number(req.headers["x-user-id"]);

    if (!userId || isNaN(userId))
      return res.status(401).json({ error: "Usuario no autenticado" });

    // Buscar stock y precio del producto antes de agregarlo
    const product = await productRepository.findById(productId);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });

    if (cantidad > product.stock)
      return res.status(400).json({ error: "Cantidad supera el stock disponible" });

    // ✅ Construimos el objeto que espera el servicio
    const productData = {
      product_id: product.id,
      name: product.name,           // ✅ Agregamos el nombre del producto
      quantity: cantidad,
      price: product.price,
      stock_available: product.stock
    };

    // Llamamos al servicio con (userId, productData)
    const cart = await service.addItem(userId, productData);

    res.status(201).json({
      message: "Producto agregado correctamente",
      cart
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
  
  // ❌ Eliminar un ítem del carrito
  // DELETE /cart/items/:item_id
  async updateQuantity(req: Request, res: Response) {
    try {
      // 🧩 Extraemos el usuario, el ID del producto y la nueva cantidad
      const userId = (req.headers["x-user-id"] || "").toString();
      const { item_id } = req.params;
      const { quantity } = req.body;

      // 🧠 Validaciones básicas
      if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
      if (!item_id || typeof quantity !== "number" || quantity <= 0)
        return res.status(400).json({ message: "Datos inválidos o cantidad inválida" });

      // 🔍 Obtener el producto desde la BD para verificar el stock
      const product = await productRepository.findById(Number(item_id));
      if (!product) return res.status(404).json({ message: "Producto no encontrado" });

      const currentStock = product.stock; // stock disponible en tiempo real

      // ✅ Llamar al servicio con los 4 argumentos requeridos
      const cart = await service.updateQuantity(
        Number(userId),
        Number(item_id),
        quantity,
        currentStock
      );

      // 🟢 Respuesta exitosa
      res.status(200).json({
        message: "Cantidad del ítem actualizada correctamente",
        cart,
      });
    } catch (error: any) {
      // ⚠️ Manejo de errores según el tipo
      if (error.message.includes("stock")) {
        res
          .status(400)
          .json({ message: "Nueva cantidad supera el stock disponible" });
      } else {
        res
          .status(400)
          .json({ message: error.message || "Error al actualizar cantidad" });
      }
    }
  }

  // 🗑️ Eliminar un producto del carrito
  async removeItem(req: Request, res: Response) {
    const { productId } = req.body;
    const userId = Number(req.headers["x-user-id"]);
    try {
      const cart = await service.removeItem(userId, productId);
      res.status(200).json({ message: "Ítem eliminado", cart });
    } catch {
      res.status(404).json({ error: "Ítem no encontrado" });
    }
  }

  // 🧹 Vaciar todo el carrito
  async clearCart(req: Request, res: Response) {
    const userId = Number(req.headers["x-user-id"]);
    try {
      await service.clearCart(userId);
      res.status(204).send();
    } catch {
      res.status(409).json({ error: "Error al intentar vaciar carrito" });
    }
  }
}