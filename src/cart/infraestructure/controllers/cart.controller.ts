import { Request, Response } from "express";
import { CartService } from "../../application/cart.service";
import { CartRepositoryMySQL } from "../repositories/cart.repository.msql";

const repository = new CartRepositoryMySQL();
const service = new CartService(repository);

export class CartController {
  async viewCart(req: Request, res: Response) {
    const userId = req.headers["x-user-id"] as string;
    try {
      const cart = await service.getCart(userId);
      res.status(200).json(cart);
    } catch (e) {
      res.status(401).json({ error: "Usuario no autenticado" });
    }
  }

  async addItem(req: Request, res: Response) {
    const { productId, cantidad } = req.body;
    const userId = req.headers["x-user-id"] as string;
    try {
      const cart = await service.addItem(userId, productId, cantidad);
      res.status(201).json({ message: "Producto agregado correctamente", cart });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async updateQuantity(req: Request, res: Response) {
    const { productId, cantidad } = req.body;
    const userId = req.headers["x-user-id"] as string;
    try {
      const cart = await service.updateQuantity(userId, productId, cantidad);
      res.status(200).json({ message: "Cantidad actualizada", cart });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async removeItem(req: Request, res: Response) {
    const { productId } = req.body;
    const userId = req.headers["x-user-id"] as string;
    try {
      const cart = await service.removeItem(userId, productId);
      res.status(200).json({ message: "Ítem eliminado", cart });
    } catch {
      res.status(404).json({ error: "Ítem no encontrado" });
    }
  }

  async clearCart(req: Request, res: Response) {
    const userId = req.headers["x-user-id"] as string;
    try {
      await service.clearCart(userId);
      res.status(204).send();
    } catch {
      res.status(409).json({ error: "Error al intentar vaciar carrito" });
    }
  }
}
