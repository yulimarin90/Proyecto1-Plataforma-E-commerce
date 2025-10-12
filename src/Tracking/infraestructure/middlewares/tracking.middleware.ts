import { Request, Response, NextFunction } from "express";
import { TrackingService } from "../../application/tracking.service";
import { TrackingRepository } from "../repositories/tracking.repository";

const trackingService = new TrackingService(new TrackingRepository());

// Extensión de Request
export interface TrackingRequest extends Request {
  tracking?: any;
}

// Middleware principal para validar que el tracking exista
export const trackingExistsMiddleware = async (req: TrackingRequest, res: Response, next: NextFunction) => {
  const id = Number(req.params.id || req.params.tracking_id);
  if (!id) return res.status(400).json({ message: "ID del tracking requerido" });

  try {
    const tracking = await trackingService.getTrackingById(id).catch(() => null);
    if (!tracking) return res.status(404).json({ message: "Tracking no encontrado" });

    req.tracking = tracking; // adjuntamos el tracking al request
    next();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error verificando el tracking" });
  }
};

// Validar que el tracking exista por número
export const trackingByNumberExistsMiddleware = async (req: TrackingRequest, res: Response, next: NextFunction) => {
  const trackingNumber = req.params.tracking_number || req.params.number;
  if (!trackingNumber) return res.status(400).json({ message: "Número de tracking requerido" });

  try {
    const tracking = await trackingService.getTrackingByNumber(trackingNumber).catch(() => null);
    if (!tracking) return res.status(404).json({ message: "Tracking no encontrado" });

    req.tracking = tracking;
    next();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error verificando el tracking" });
  }
};

// Validación de creación de tracking
export const validateCreateTracking = (req: Request, res: Response, next: NextFunction) => {
  const { order_id, tracking_number, status, current_location, carrier_name } = req.body;

  if (!order_id || isNaN(Number(order_id))) {
    return res.status(400).json({ message: "ID de orden inválido o requerido" });
  }

  if (!tracking_number || tracking_number.trim().length < 3) {
    return res.status(400).json({ message: "Número de tracking inválido o requerido (mínimo 3 caracteres)" });
  }

  if (!status || !['pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(status)) {
    return res.status(400).json({ 
      message: "Estado inválido. Estados válidos: pending, in_transit, out_for_delivery, delivered, cancelled, returned" 
    });
  }

  if (!current_location || current_location.trim().length < 2) {
    return res.status(400).json({ message: "Ubicación actual inválida o requerida (mínimo 2 caracteres)" });
  }

  if (!carrier_name || carrier_name.trim().length < 2) {
    return res.status(400).json({ message: "Nombre del transportista inválido o requerido (mínimo 2 caracteres)" });
  }

  // Validar fecha de entrega estimada si se proporciona
  if (req.body.estimated_delivery_date) {
    const estDate = new Date(req.body.estimated_delivery_date);
    if (isNaN(estDate.getTime()) || estDate <= new Date()) {
      return res.status(400).json({ message: "Fecha de entrega estimada inválida o debe ser futura" });
    }
  }

  // Validar teléfono del transportista si se proporciona
  if (req.body.carrier_phone) {
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(req.body.carrier_phone)) {
      return res.status(400).json({ message: "Teléfono del transportista inválido" });
    }
  }

  next();
};

// Validación de actualización de tracking
export const validateUpdateTracking = (req: Request, res: Response, next: NextFunction) => {
  const { status, current_location, carrier_name } = req.body;

  if (status && !['pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(status)) {
    return res.status(400).json({ 
      message: "Estado inválido. Estados válidos: pending, in_transit, out_for_delivery, delivered, cancelled, returned" 
    });
  }

  if (current_location && current_location.trim().length < 2) {
    return res.status(400).json({ message: "Ubicación actual inválida (mínimo 2 caracteres)" });
  }

  if (carrier_name && carrier_name.trim().length < 2) {
    return res.status(400).json({ message: "Nombre del transportista inválido (mínimo 2 caracteres)" });
  }

  // Validar fecha de entrega estimada si se proporciona
  if (req.body.estimated_delivery_date) {
    const estDate = new Date(req.body.estimated_delivery_date);
    if (isNaN(estDate.getTime())) {
      return res.status(400).json({ message: "Fecha de entrega estimada inválida" });
    }
  }

  // Validar teléfono del transportista si se proporciona
  if (req.body.carrier_phone) {
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(req.body.carrier_phone)) {
      return res.status(400).json({ message: "Teléfono del transportista inválido" });
    }
  }

  next();
};

// Validación de actualización de estado
export const validateUpdateStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status, location } = req.body;

  if (!status || !['pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(status)) {
    return res.status(400).json({ 
      message: "Estado inválido. Estados válidos: pending, in_transit, out_for_delivery, delivered, cancelled, returned" 
    });
  }

  if (!location || location.trim().length < 2) {
    return res.status(400).json({ message: "Ubicación inválida o requerida (mínimo 2 caracteres)" });
  }

  // Validar notas si se proporcionan
  if (req.body.notes && req.body.notes.trim().length > 500) {
    return res.status(400).json({ message: "Las notas no pueden exceder 500 caracteres" });
  }

  next();
};

// Validar que el tracking esté activo antes de actualizar
export const validateActiveTracking = async (req: TrackingRequest, res: Response, next: NextFunction) => {
  if (!req.tracking) {
    return res.status(404).json({ message: "Tracking no encontrado" });
  }

  if (Number(req.tracking.is_active) !== 1) {
    return res.status(400).json({ message: "No se puede modificar un tracking inactivo" });
  }

  if (req.tracking.status === 'delivered') {
    return res.status(400).json({ message: "No se puede modificar un tracking entregado" });
  }

  if (req.tracking.status === 'cancelled') {
    return res.status(400).json({ message: "No se puede modificar un tracking cancelado" });
  }

  next();
};

// Validar que se pueda eliminar el tracking
export const validateDeleteTracking = async (req: TrackingRequest, res: Response, next: NextFunction) => {
  if (!req.tracking) {
    return res.status(404).json({ message: "Tracking no encontrado" });
  }

  // Solo permitir eliminar trackings en estado pending o cancelled
  if (!['pending', 'cancelled'].includes(req.tracking.status)) {
    return res.status(400).json({ 
      message: "Solo se pueden eliminar trackings en estado 'pending' o 'cancelled'" 
    });
  }

  next();
};

// Validar parámetros de consulta para filtros
export const validateQueryParams = (req: Request, res: Response, next: NextFunction) => {
  const { status, page, limit } = req.query;

  if (status && !['pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(status as string)) {
    return res.status(400).json({ 
      message: "Estado inválido. Estados válidos: pending, in_transit, out_for_delivery, delivered, cancelled, returned" 
    });
  }

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ message: "Número de página inválido" });
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({ message: "Límite inválido (debe estar entre 1 y 100)" });
  }

  next();
};