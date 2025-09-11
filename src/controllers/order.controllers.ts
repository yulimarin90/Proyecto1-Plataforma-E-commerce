// controllers/order.controller.ts
import { Request, Response } from "express";
import { Order } from "../models/order.models";
import { Product } from "../models/product.models";

// Crear orden
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { usuario_id, productos } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({ message: "Debe incluir al menos un producto" });
    }

    // Calcular total
    let total = 0;
    const detalles = [];

    for (const item of productos) {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      interface detalles({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal,
        });

      // Descontar stock
      await Product.findByIdAndUpdate(item.producto_id, {
        $inc: { stock: -item.cantidad },
      });
    }

    const order = new Order({
      usuario_id,
      productos: detalles,
      total,
      estado: "pendiente",
      seguimiento: [{ estado: "pendiente", comentario: "Orden creada" }],
    });

    await order.save();
    res.status(201).json({ message: "Orden creada correctamente", order });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Obtener todas las órdenes
export const getOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate("usuario_id", "name email");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Verificar compra (por id)
export const verifyPurchase = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate("usuario_id", "name email");
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json({ valid: true, order });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Obtener órdenes de un usuario
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ usuario_id: req.params.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Obtener detalles de una orden
export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate("productos.producto_id");
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order.productos);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Cancelar orden
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    order.estado = "cancelada";
    order.seguimiento.push({ estado: "cancelada", comentario: "Orden cancelada" });
    await order.save();

    res.json({ message: "Orden cancelada", order });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Asignar seguimiento a una orden
export const assignTracking = async (req: Request, res: Response) => {
  try {
    const { estado, comentario } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    order.estado = estado;
    order.seguimiento.push({ estado, comentario });
    await order.save();

    res.json({ message: "Seguimiento actualizado", order });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};
