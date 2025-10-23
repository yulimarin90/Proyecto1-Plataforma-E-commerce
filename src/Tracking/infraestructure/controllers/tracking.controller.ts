import { Request, Response } from "express";
import { TrackingService } from "../../application/tracking.service";
import { TrackingRepository } from "../repositories/tracking.repository";
import { Tracking } from "../../domain/tracking.entity";
import db from "../../../config/db";

let trackingService = new TrackingService(new TrackingRepository());

// Setter para pruebas
export const setTrackingService = (svc: any) => {
  trackingService = svc;
};

type TrackingResponse = Tracking & {
  status_display: string;
  // Con exactOptionalPropertyTypes, si asignamos undefined explícitamente debe estar en el tipo
  estimated_delivery_formatted?: string | undefined;
  actual_delivery_formatted?: string | undefined;
  created_at_formatted: string;
  updated_at_formatted: string;
};

export const createTracking = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    payload.is_active = Number(payload.is_active) === 1 ? 1 : 0;

    // Generar número de tracking si no se envía
    if (!payload.tracking_number) {
      payload.tracking_number = await trackingService.generateTrackingNumber();
    }

    // Crear tracking (sin notificación todavía)
    const { created, orderUserId } = await trackingService.createTracking(payload);

    // Crear notificación y obtener su ID
    const message = `Se ha creado un nuevo tracking (${created.tracking_number}) para tu pedido #${created.order_id}`;
    const [notificationResult]: any = await db.query(
      `INSERT INTO notifications (user_id, order_id, type, channel, message, status)
       VALUES (?, ?, 'SHIPMENT', 'WEB', ?, 'SENT')`,
      [orderUserId, created.order_id, message]
    );
    const notificationId = notificationResult.insertId;

    // Actualizar el tracking con el ID de la notificación
    await db.query(
      `UPDATE trackings SET id_notificaciones = ? WHERE id = ?`,
      [notificationId, created.id]
    );

    // Emitir evento WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`order_${created.order_id}`).emit("order_tracking_created", {
        tracking: { ...created, notification_id: notificationId },
        message,
        timestamp: new Date().toISOString(),
      });
    }

    // Responder al cliente
    res.status(201).json({
      message: "Tracking creado con éxito",
      tracking: { ...created, notification_id: notificationId }
    });

  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || "Error al crear tracking"
    });
  }
};

// Obtener tracking por ID
export const getTrackingById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id || req.params.tracking_id);
    if (isNaN(id)) return res.status(400).json({ message: "ID de tracking inválido o faltante" });

    const tracking = await trackingService.getTrackingById(id);
    const userId = (req as any).user?.id;

    if (tracking.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para ver este tracking" });
    }

    const response = formatTrackingResponse(tracking);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al obtener tracking" });
  }
};

// Obtener tracking por número
export const getTrackingByNumber = async (req: Request, res: Response) => {
  try {
    const trackingNumber = req.params.tracking_number || req.params.number;
    if (!trackingNumber) return res.status(400).json({ message: "Número de tracking requerido" });

    const tracking = await trackingService.getTrackingByNumber(trackingNumber);
    const userId = (req as any).user?.id;

    if (tracking.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para ver este tracking" });
    }

    const response = formatTrackingResponse(tracking);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al obtener tracking" });
  }
};

// Obtener tracking por orden
export const getTrackingByOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.order_id);
    if (isNaN(orderId)) return res.status(400).json({ message: "ID de orden inválido o faltante" });

    const tracking = await trackingService.getTrackingByOrder(orderId);
    const userId = (req as any).user?.id;

    if (tracking.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para ver este tracking" });
    }

    const response = formatTrackingResponse(tracking);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al obtener tracking" });
  }
};

export const updateTrackingStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de tracking inválido o faltante" });
    }

    const { status, location, notes } = req.body;

    // Buscar tracking
    const tracking = await trackingService.getTrackingById(id);
    if (!tracking) {
      return res.status(404).json({ message: "Tracking no encontrado" });
    }

    // Lógica: cancelación solo si está pendiente
    if (["CANCELADO", "CANCELLED"].includes(status.toUpperCase())) {
      if (tracking.status === "pending") {
        const cancelledTracking = await trackingService.updateTrackingStatus(id, "cancelled", location, notes);

        // Crear notificación de cancelación
        const message = `Tu pedido #${tracking.order_id} ha sido cancelado mientras estaba pendiente.`;
        const [notif]: any = await db.query(
          `INSERT INTO notifications (user_id, order_id, type, channel, message, status)
           VALUES (?, ?, 'SHIPMENT', 'WEB', ?, 'SENT')`,
          [tracking.user_id, tracking.order_id, message]
        );

        const notificationId = notif.insertId;

        // Asociar notificación y marcar como inactivo
        await db.query(
          `UPDATE trackings SET notification_id = ?, is_active = 0 WHERE id = ?`,
          [notificationId, id]
        );

        // Emitir evento por WebSocket
        const io = req.app.get("io");
        if (io) {
          io.to(`order_${tracking.order_id}`).emit("order_tracking_cancelled", {
            tracking_id: id,
            order_id: tracking.order_id,
            message,
            timestamp: new Date().toISOString(),
          });
        }

        return res.status(200).json({
          message: "Tracking cancelado con éxito",
          tracking: { ...cancelledTracking, notification_id: notificationId },
        });
      } else {
        return res.status(400).json({
          message: "No se puede cancelar un tracking en estado avanzado",
        });
      }
    }

    // Cambio normal de estado
    const updatedTracking = await trackingService.updateTrackingStatus(id, status, location, notes);
if (!updatedTracking) {
  return res.status(500).json({ message: "No se pudo actualizar el tracking" });
}

const response = formatTrackingResponse(updatedTracking);
    
const [orderRows]: any = await db.query(
  `SELECT user_id FROM orders WHERE id = ?`,
  [updatedTracking.order_id]
);
const userId = orderRows[0]?.user_id;

if (!userId) {
  throw { status: 500, message: "No se encontró el user_id de la orden" };
}

    // Crear notificación del cambio
    const message = `El estado de tu pedido #${updatedTracking.order_id} cambió a ${status.toUpperCase()}`;
    const [notif]: any = await db.query(
      `INSERT INTO notifications (user_id, order_id, type, channel, message, status)
       VALUES (?, ?, 'SHIPMENT', 'WEB', ?, 'SENT')`,
      [updatedTracking.user_id, updatedTracking.order_id, message]
    );

    const notificationId = notif.insertId;
    await db.query(`UPDATE trackings SET notification_id = ? WHERE id = ?`, [notificationId, id]);

    // Emitir eventos WebSocket
    const io = req.app.get("io");
    if (io) {
      io.emit("tracking_update", { tracking: response });
      io.to(`tracking_${id}`).emit("tracking_status_update", { tracking: response });
      io.to(`order_${updatedTracking.order_id}`).emit("order_tracking_update", { tracking: response });
    }

    res.status(200).json({
      message: "Estado actualizado con éxito",
      tracking: { ...response, notification_id: notificationId },
    });
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || "Error al actualizar estado del tracking",
    });
  }
};

// Obtener trackings por estado
export const getTrackingsByStatus = async (req: Request, res: Response) => {
  try {
    const status = req.params.status as Tracking['status'];
    const validStatuses = ['pending', 'preparing', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}` });
    }

    const trackings = await trackingService.getTrackingsByStatus(status);
    const formattedTrackings = trackings.map(formatTrackingResponse);
    res.status(200).json(formattedTrackings);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al obtener trackings por estado" });
  }
};



// Listar todos los trackings (con soporte básico de paginación)
export const getTrackings = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query as { status?: string; page?: string; limit?: string };

    let trackings = [] as Tracking[];
    if (status) {
      trackings = await trackingService.getTrackingsByStatus(status as Tracking['status']);
    } else {
      trackings = await trackingService.getAllTrackings();
    }

    const formatted = trackings.map(formatTrackingResponse);

    // Paginación en memoria (opcional)
    const p = page ? Math.max(1, Number(page)) : 1;
    const l = limit ? Math.min(100, Math.max(1, Number(limit))) : formatted.length;
    const start = (p - 1) * l;
    const paginated = formatted.slice(start, start + l);

    res.status(200).json({
      items: paginated,
      total: formatted.length,
      page: p,
      limit: l
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al obtener trackings" });
  }
};

// Obtener trackings activos
export const getActiveTrackings = async (_req: Request, res: Response) => {
  try {
    const trackings = await trackingService.getActiveTrackings();
    const formatted = trackings.map(formatTrackingResponse);
    res.status(200).json(formatted);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al obtener trackings activos" });
  }
};

// Actualizar tracking (PUT)
export const updateTracking = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID de tracking inválido o faltante" });

    const updated = await trackingService.updateTracking(id, req.body);
    const response = formatTrackingResponse(updated);
    res.status(200).json({ message: "Tracking actualizado con éxito", tracking: response });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al actualizar tracking" });
  }
};

// Eliminar tracking
export const deleteTracking = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID de tracking inválido o faltante" });

    await trackingService.deleteTracking(id);
    res.status(200).json({ message: "Tracking eliminado correctamente" });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al eliminar tracking" });
  }
};

// Formatear respuesta
function formatTrackingResponse(tracking: Tracking): TrackingResponse {
  const statusDisplay: Record<Tracking['status'], string> = {
    'pending': 'Pendiente',
    'preparing': 'Preparando',
    'in_transit': 'En tránsito',
    'out_for_delivery': 'En reparto',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado',
    'returned': 'Devuelto',
  };

  return {
    ...tracking,
    status_display: statusDisplay[tracking.status],
    estimated_delivery_formatted: tracking.estimated_delivery_date
      ? new Date(tracking.estimated_delivery_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : undefined,
    actual_delivery_formatted: tracking.actual_delivery_date
      ? new Date(tracking.actual_delivery_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : undefined,
    created_at_formatted: tracking.created_at
      ? new Date(tracking.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '',
    updated_at_formatted: tracking.updated_at
      ? new Date(tracking.updated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : ''
  };
}
