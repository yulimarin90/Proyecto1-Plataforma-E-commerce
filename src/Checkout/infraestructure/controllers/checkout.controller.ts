// src/checkout/checkout.controller.ts
import { Request, Response } from "express";
import { CheckoutService } from "../../application/checkout.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

export class CheckoutController {
  static async checkout(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await CheckoutService.processCheckout({ ...req.body, userId: req.user?.id || 1 });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async placeOrder(req: Request, res: Response) {
    try {
      const result = await CheckoutService.processCheckout(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  }

  static async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const orders = await CheckoutService.getOrders(Number(req.user?.id || 1));
      res.status(200).json(orders);
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener órdenes" });
    }
  }

  static async getOrderById(req: Request, res: Response) {
    try {
      const order = await CheckoutService.getOrderById(Number(req.params.order_id));
      res.status(200).json(order);
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }

  static async confirmStock(req: Request, res: Response) {
    try {
      const { order_id } = req.params;
      const { products } = req.body;
      const result = await CheckoutService.confirmStock(Number(order_id), products);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  }
}
