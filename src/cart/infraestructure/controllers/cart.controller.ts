import { Request, Response } from "express";
import { CartService } from "../../application/cart.service";
import { ProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";
import { CartRepository } from "../repositories/cart.repository.msql";

let productRepository = new ProductsRepository();
let repository = new CartRepository(productRepository);
let cartService = new CartService(repository);

export const setCartService = (svc: any) => (cartService = svc);
export const setProductsRepository = (repo: any) => (productRepository = repo);

export class CartController {
  /** 🧭 Utilidad para obtener el ID de usuario */
  private getUserId(req: Request): number {
  return Number(req.headers["x-user-id"] || req.body.user_id);
}

  /** 📥 Ver carrito del usuario */
  async viewCart(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      if (isNaN(userId)) return res.status(401).json({ error: "Usuario no autenticado" });

      const cart = await cartService.getCart(userId);
      return res.status(200).json(cart);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  /** 🛒 Agregar producto al carrito */
  async addItem(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      if (isNaN(userId)) return res.status(401).json({ error: "Usuario no autenticado" });

      const productId = Number(req.body.productId);
      const quantity = Number(req.body.quantity);

      if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: "productId debe ser un número válido" });
      }

      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: "quantity debe ser un número positivo" });
      }

      const product = await productRepository.findById(productId);
      if (!product) return res.status(404).json({ error: "Producto no encontrado" });

      if (quantity > product.stock) {
        return res.status(400).json({ error: "Cantidad supera el stock disponible" });
      }

      // Verificar expiración de carrito
      const cart = await cartService.getCart(userId);
      if (cart?.expires_at && new Date() > new Date(cart.expires_at)) {
        return res.status(410).json({ message: "El carrito ha expirado por inactividad" });
      }

      // ✅ Código corregido
const now = new Date();
const productData = {
  product_id: product.id!,
  name: product.name,
  quantity: quantity,
  price: Number(product.price),
  created_at: now,
  updated_at: now,
};


      const updatedCart = await cartService.addItem(userId, productData, product.stock);
      return res.status(201).json({ message: "Producto agregado correctamente", cart: updatedCart });

    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Error interno del servidor" });
    }
  }

  /** 🧮 Modificar cantidad de un ítem */
  async updateQuantity(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      const { productId, quantity } = req.body;

      if (isNaN(userId)) return res.status(401).json({ error: "Usuario no autenticado" });
      if (!productId || quantity === undefined) {
        return res.status(400).json({ error: "productId y quantity son requeridos" });
      }

      const product = await productRepository.findById(Number(productId));
      if (!product) return res.status(404).json({ error: "Producto no encontrado" });

      if (quantity > product.stock) {
        return res.status(400).json({ error: "Cantidad supera el stock disponible" });
      }

      const updatedCart = await cartService.updateQuantity(
        userId,
        Number(productId),
        Number(quantity),
        product.stock
      );

      return res.status(200).json({ message: "Cantidad actualizada", cart: updatedCart });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  /** 🗑️ Eliminar un producto del carrito */
  async removeItem(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      const productId = Number(req.params.productId ?? req.body.productId);

      if (isNaN(userId)) return res.status(401).json({ error: "Usuario no autenticado" });
      if (isNaN(productId)) return res.status(400).json({ error: "productId es requerido" });

      const cart = await cartService.removeItem(userId, productId);
      return res.status(200).json({ message: "Ítem eliminado", cart });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  /** 🧼 Vaciar carrito */
  async clearCart(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      if (isNaN(userId)) return res.status(401).json({ error: "Usuario no autenticado" });

      await cartService.clearCart(userId);
      return res.status(204).send();
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  /** 🧾 Pasar carrito a checkout / orden */
  async checkout(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      const { shipping_address, payment_method } = req.body;

      if (isNaN(userId)) return res.status(401).json({ error: "Usuario no autenticado" });

      const cart = await cartService.getCart(userId);
      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío" });
      }

      if (cart.expires_at && new Date() > new Date(cart.expires_at)) {
        return res.status(410).json({ error: "El carrito ha expirado" });
      }

      // Verificar stock actualizado
      for (const item of cart.items) {
        const product = await productRepository.findById(item.product_id);
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({
            error: `El producto ${item.name} no tiene stock suficiente`,
          });
        }
      }

      const order = await cartService.checkout(
        userId,
        shipping_address,
        payment_method
      );

      return res.status(201).json({ message: "Orden creada con éxito", order });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
}
