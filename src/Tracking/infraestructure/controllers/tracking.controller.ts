import { Request, Response } from "express";
import { TrackingService } from "../../application/tracking.service";
import { TrackingRepository } from "../repositories/tracking.repository";
import { Tracking } from "../../domain/tracking.entity";

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

// Crear tracking
export const createTracking = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    payload.is_active = payload.is_active === true || payload.is_active === "true" || payload.is_active === 1 ? 1 : 0;

    if (!payload.tracking_number) {
      payload.tracking_number = await trackingService.generateTrackingNumber();
    }

    if (!payload.estimated_delivery_date) {
      payload.estimated_delivery_date = trackingService.calculateEstimatedDeliveryDate(
        payload.carrier_name,
        payload.current_location,
        payload.destination_location || payload.current_location
      );
    }

    payload.user_id = (req as any).user?.id; // Asignar el usuario propietario

    const result = await trackingService.createTracking(payload);
    if (!result) return res.status(400).json({ message: "No se pudo crear el tracking" });

    const response = formatTrackingResponse(result);
    res.status(201).json({ message: "Tracking creado con éxito", tracking: response });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al crear tracking" });
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

// Actualizar estado del tracking
export const updateTrackingStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID de tracking inválido o faltante" });

    const { status, location, notes } = req.body;
    const result = await trackingService.updateTrackingStatus(id, status, location, notes);
    const response = formatTrackingResponse(result.tracking);

    // Emitir notificación por WebSocket
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('tracking_update', { tracking: response, notification: result.notification });
      io.to(`tracking_${id}`).emit('tracking_status_update', { tracking: response, notification: result.notification });
      io.to(`order_${result.tracking.order_id}`).emit('order_tracking_update', { tracking: response, notification: result.notification });
    }

    res.status(200).json({ message: "Estado actualizado con éxito", tracking: response, notification: result.notification });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al actualizar estado" });
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
