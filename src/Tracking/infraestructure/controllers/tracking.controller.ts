import { Request, Response } from "express";
import { TrackingService } from "../../application/tracking.service";
import { TrackingRepository } from "../repositories/tracking.repository";
import { Tracking, TrackingNotification } from "../../domain/tracking.entity";
import { AuthService } from "../../../Users/Authentication/auth.service";

let trackingService = new TrackingService(new TrackingRepository());
// Setter para pruebas: permite inyectar un mock desde los tests de integración
export const setTrackingService = (svc: any) => {
  trackingService = svc;
};

type TrackingResponse = Tracking & { 
  status_display: string;
  estimated_delivery_formatted?: string | undefined;
  actual_delivery_formatted?: string | undefined;
  created_at_formatted: string;
  updated_at_formatted: string;
};

// Crear tracking
export const createTracking = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Convertir booleanos a número
    payload.is_active = payload.is_active === true || payload.is_active === "true" || payload.is_active === 1 ? 1 : 0;

    // Si no se proporciona número de tracking, generar uno automáticamente
    if (!payload.tracking_number) {
      payload.tracking_number = await trackingService.generateTrackingNumber();
    }

    // Calcular fecha estimada de entrega si no se proporciona
    if (!payload.estimated_delivery_date) {
      payload.estimated_delivery_date = trackingService.calculateEstimatedDeliveryDate(
        payload.carrier_name,
        payload.current_location,
        payload.destination_location || payload.current_location
      );
    }

    const result = await trackingService.createTracking(payload);

    if (!result) {
      return res.status(400).json({ message: "No se pudo crear el tracking" });
    }
    // Formatear respuesta
    const response = formatTrackingResponse(result);

    res.status(201).json({ 
      message: "Tracking creado con éxito", 
      tracking: response 
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al crear tracking" 
    });
  }
};

// Obtener todos los trackings
export const getTrackings = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let trackings = await trackingService.getAllTrackings();

    // Filtrar por estado si se proporciona
    if (status) {
      trackings = trackings.filter(t => t.status === status);
    }

    // Paginación
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTrackings = trackings.slice(startIndex, endIndex);

    // Formatear trackings
    const formattedTrackings = paginatedTrackings.map(formatTrackingResponse);

    // Metadatos de paginación
    const totalPages = Math.ceil(trackings.length / limitNum);

    res.status(200).json({
      trackings: formattedTrackings,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: trackings.length,
        items_per_page: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      }
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al obtener trackings" 
    });
  }
};

// Obtener tracking por ID
export const getTrackingById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id || req.params.tracking_id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de tracking inválido o faltante" });
    }

    const tracking = await trackingService.getTrackingById(id);
    const response = formatTrackingResponse(tracking);

    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al obtener tracking" 
    });
  }
};

// Obtener tracking por número de seguimiento
export const getTrackingByNumber = async (req: Request, res: Response) => {
  try {
    const trackingNumber = req.params.tracking_number || req.params.number;
    if (!trackingNumber) {
      return res.status(400).json({ message: "Número de tracking requerido" });
    }

    const tracking = await trackingService.getTrackingByNumber(trackingNumber);
    const response = formatTrackingResponse(tracking);

    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al obtener tracking" 
    });
  }
};

// Obtener tracking por orden
export const getTrackingByOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.order_id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID de orden inválido o faltante" });
    }

    const tracking = await trackingService.getTrackingByOrder(orderId);
    const response = formatTrackingResponse(tracking);

    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al obtener tracking" 
    });
  }
};

// Actualizar tracking
export const updateTracking = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de tracking inválido o faltante" });
    }

    const payload = req.body;

    // Convertir booleanos a número
    if (payload.is_active !== undefined) {
      payload.is_active = payload.is_active === true || payload.is_active === "true" || payload.is_active === 1 ? 1 : 0;
    }

    const updated = await trackingService.updateTracking(id, payload);
    const response = formatTrackingResponse(updated);

    res.status(200).json({ 
      message: "Tracking actualizado con éxito", 
      tracking: response 
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al actualizar tracking" 
    });
  }
};

// Actualizar estado del tracking
export const updateTrackingStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de tracking inválido o faltante" });
    }

    const { status, location, notes } = req.body;

    const result = await trackingService.updateTrackingStatus(id, status, location, notes);
    const response = formatTrackingResponse(result.tracking);

    // Emitir notificación por WebSocket si está disponible
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('tracking_update', {
        tracking: response,
        notification: result.notification
      });

      // Emitir a sala específica del tracking
      io.to(`tracking_${id}`).emit('tracking_status_update', {
        tracking: response,
        notification: result.notification
      });

      // Emitir a sala específica de la orden
      io.to(`order_${result.tracking.order_id}`).emit('order_tracking_update', {
        tracking: response,
        notification: result.notification
      });
    }

    res.status(200).json({ 
      message: "Estado actualizado con éxito", 
      tracking: response,
      notification: result.notification
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al actualizar estado" 
    });
  }
};

// Eliminar tracking
export const deleteTracking = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.tracking_id || req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de tracking inválido o faltante" });
    }

    await trackingService.deleteTracking(id);
    res.status(200).json({ message: "Tracking eliminado correctamente" });
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al eliminar tracking" 
    });
  }
};

// Obtener trackings activos
export const getActiveTrackings = async (req: Request, res: Response) => {
  try {
    const trackings = await trackingService.getActiveTrackings();
    const formattedTrackings = trackings.map(formatTrackingResponse);

    res.status(200).json(formattedTrackings);
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al obtener trackings activos" 
    });
  }
};

// Obtener trackings por estado
export const getTrackingsByStatus = async (req: Request, res: Response) => {
  try {
    const status = req.params.status as Tracking['status'];
    
    if (!['pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(status)) {
      return res.status(400).json({ 
        message: "Estado inválido. Estados válidos: pending, in_transit, out_for_delivery, delivered, cancelled, returned" 
      });
    }

    const trackings = await trackingService.getTrackingsByStatus(status);
    const formattedTrackings = trackings.map(formatTrackingResponse);

    res.status(200).json(formattedTrackings);
  } catch (error: any) {
    res.status(error.status || 500).json({ 
      message: error.message || "Error al obtener trackings por estado" 
    });
  }
};

// Función auxiliar para formatear tracking
function formatTrackingResponse(tracking: Tracking): TrackingResponse {
  const statusDisplay: Record<Tracking['status'], string> = {
    'pending': 'Pendiente',
    'in_transit': 'En tránsito',
    'out_for_delivery': 'En reparto',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado',
    'returned': 'Devuelto'
  };

  return {
    ...tracking,
    status_display: statusDisplay[tracking.status],
    estimated_delivery_formatted: tracking.estimated_delivery_date 
      ? new Date(tracking.estimated_delivery_date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : undefined,
    actual_delivery_formatted: tracking.actual_delivery_date
      ? new Date(tracking.actual_delivery_date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : undefined,
    created_at_formatted: tracking.created_at
      ? new Date(tracking.created_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '',
    updated_at_formatted: tracking.updated_at
      ? new Date(tracking.updated_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : ''
  };
}