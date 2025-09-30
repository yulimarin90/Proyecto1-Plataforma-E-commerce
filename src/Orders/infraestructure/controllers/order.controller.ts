// orders.controller.ts
// Controladores de endpoints de órdenes

import { Request, Response } from "express";
import { OrdersService } from "../../application/order.service";

const service = new OrdersService();

export class OrdersController {
  static async createOrder(req: Request, res: Response) {
    try {
      const order = await service.createOrder(req.body);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  static async getOrdersByUser(req: Request, res: Response) {
    try {
      const orders = await service.getOrdersByUser(req.params.userId);
      res.status(200).json(orders);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  static async getOrderById(req: Request, res: Response) {
    try {
      const order = await service.getOrderById(req.params.orderId);
      res.status(200).json(order);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  static async cancelOrder(req: Request, res: Response) {
    try {
      const cancelled = await service.cancelOrder(req.params.orderId, req.body.reason);
      res.status(200).json(cancelled);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  static async assignTracking(req: Request, res: Response) {
    try {
      const tracking = await service.assignTracking(req.params.orderId, req.body);
      res.status(201).json(tracking);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  static async getAllOrders(req: Request, res: Response) {
    try {
      const orders = await service.getAllOrders();
      res.status(200).json(orders);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}
