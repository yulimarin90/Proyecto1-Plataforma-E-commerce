import { Request, Response } from "express";
import { CartService } from "../../application/cart.service";
import { ProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";
import { CartRepository } from "../repositories/cart.repository.msql";

// Instancias del servicio y repositorios
const productRepository = new ProductsRepository();
const repository = new CartRepository(productRepository);
const service = new CartService(repository);

export class CartController {
  async viewCart(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      const cart = await service.getCart(userId);
      res.status(200).json(cart);
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  }

  async addItem(req: Request, res: Response) {
    try {
         const userId = Number(req.body.user_id || req.params.user_id);
      const { productId, cantidad } = req.body;

      // Validar datos de entrada
      if (!productId || !cantidad) {
        return res.status(400).json({ error: "productId y cantidad son requeridos" });
      }

      const product = await productRepository.findById(Number(productId));
      if (!product || !product.id) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (cantidad > product.stock) {
        return res.status(400).json({ error: "Cantidad supera el stock disponible" });
      }

      // Construimos el objeto con números seguros
      const productData = {
        product_id: Number(product.id),
        name: product.name,
        quantity: Number(cantidad),
        price: Number(product.price),
        stock_available: Number(product.stock),
      };

      // Log para depurar
      console.log("productData a insertar:", productData);

      // Validación extra para evitar NaN
      if (
        isNaN(productData.product_id) ||
        isNaN(productData.quantity) ||
        isNaN(productData.price) ||
        isNaN(productData.stock_available)
      ) {
        console.error("Datos inválidos detectados en productData");
        return res.status(400).json({
          error: "Datos inválidos en el producto. Revisa los valores enviados o en la BD.",
        });
      }

      const cart = await service.addItem(userId, productData);
      res.status(201).json({ message: "Producto agregado", cart });

    } catch (e: any) {
      console.error("Error en addItem:", e);
      res.status(400).json({ error: e.message });
    }
  }

  async updateQuantity(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      const { item_id } = req.params;
      const { quantity } = req.body;

      const product = await productRepository.findById(Number(item_id));
      if (!product) return res.status(404).json({ message: "Producto no encontrado" });

      const cart = await service.updateQuantity(
        userId,
        Number(item_id),
        quantity,
        product.stock
      );

      res.status(200).json({ message: "Cantidad actualizada", cart });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async removeItem(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      const { productId } = req.body;
      const cart = await service.removeItem(userId, productId);
      res.status(200).json({ message: "Ítem eliminado", cart });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async clearCart(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      await service.clearCart(userId);
      res.status(204).send();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}