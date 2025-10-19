import { Request, Response } from "express";
import { OrdersService } from "../../application/order.service";

let ordersService = new OrdersService();

// Setter para pruebas: permite inyectar un mock desde los tests de integración
export const setOrdersService = (svc: any) => {
  ordersService = svc;
};


const parseBoolToNumber = (value: any, defaultValue: number = 1) => {
  if (value === undefined || value === null) return defaultValue;
  if (value === true || value === "true" || value === "1" || value === 1) return 1;
  return 0;
};


export const createOrder = async (req: Request, res: Response) => {
  try {
    const payload = {
      ...req.body,
      userEmail: (req as any).user?.email //si el email viene del token
    };

    const order = await ordersService.createOrder(payload);
    res.status(201).json({
      code: 201,
      message: "Orden creada exitosamente",
      data: order
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      code: error.status || 500,
      message: error.message || "Error interno al crear la orden"
    });
  }
};


export const getOrdersByUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);
    if (isNaN(userId)) {
      return res.status(400).json({ code: 400, message: "ID de usuario inválido" });
    }

    const orders = await ordersService.getOrdersByUser(userId);
    res.status(200).json({
      code: 200,
      message: "Lista de órdenes del usuario",
      data: orders
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      code: error.status || 500,
      message: error.message || "Error interno al obtener órdenes del usuario"
    });
  }
};


export const getOrderById = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.order_id);
    if (isNaN(orderId)) {
      return res.status(400).json({ code: 400, message: "ID de orden inválido" });
    }

    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ code: 404, message: "Orden no encontrada" });
    }

    res.status(200).json({
      code: 200,
      message: "Detalle completo de la orden",
      data: order
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      code: error.status || 500,
      message: error.message || "Error interno al obtener la orden"
    });
  }
};


export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.order_id);
    if (isNaN(orderId)) {
      return res.status(400).json({ code: 400, message: "ID de orden inválido" });
    }

    const { reason } = req.body;
    const cancelled = await ordersService.cancelOrder(orderId, reason);

    res.status(200).json({
      code: 200,
      message: "Orden cancelada correctamente",
      data: cancelled
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      code: error.status || 500,
      message: error.message || "Error interno al cancelar la orden"
    });
  }
};


export const assignTracking = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.order_id);
    if (isNaN(orderId)) {
      return res.status(400).json({ code: 400, message: "ID de orden inválido" });
    }

    const tracking = await ordersService.assignTracking(orderId, req.body);
    res.status(201).json({
      code: 201,
      message: "Número de tracking asignado correctamente",
      data: tracking
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      code: error.status || 500,
      message: error.message || "Error interno al asignar tracking"
    });
  }
};


export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await ordersService.getAllOrders();
    res.status(200).json({
      code: 200,
      message: "Listado de todas las órdenes",
      data: orders
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      code: error.status || 500,
      message: error.message || "Error interno al obtener todas las órdenes"
    });
  }
};
