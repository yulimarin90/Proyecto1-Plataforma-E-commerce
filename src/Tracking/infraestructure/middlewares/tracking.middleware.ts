import { Request, Response, NextFunction } from "express";
import { TrackingService } from "../../application/tracking.service";
import { TrackingRepository } from "../repositories/tracking.repository";

const trackingService = new TrackingService(new TrackingRepository());

// Extensión de Request
export interface TrackingRequest extends Request {
  tracking?: any;
}

// Estados válidos según reglas de negocio
const validStatuses = ['pending', 'preparing', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

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

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}` 
    });
  }

   // Validar fecha de entrega estimada si se proporciona
  if (req.body.estimated_delivery_date) {
    const estDate = new Date(req.body.estimated_delivery_date);
    if (isNaN(estDate.getTime()) || estDate <= new Date()) {
      return res.status(400).json({ message: "Fecha de entrega estimada inválida" });
    }
  }

  next();
};

// Validación de actualización de tracking
export const validateUpdateTracking = (req: Request, res: Response, next: NextFunction) => {
  const { status, current_location, carrier_name } = req.body;

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}` });
  }

  if (current_location && current_location.trim().length < 2) {
    return res.status(400).json({ message: "Ubicación actual inválida" });
  }

  if (carrier_name && carrier_name.trim().length < 2) {
    return res.status(400).json({ message: "Nombre del transportista inválido" });
  }

  // Validar fecha de entrega estimada si se proporciona
  if (req.body.estimated_delivery_date) {
    const estDate = new Date(req.body.estimated_delivery_date);
    if (isNaN(estDate.getTime())) {
      return res.status(400).json({ message: "Fecha de entrega estimada inválida" });
    }
  }

  next();
};

// Validación de actualización de estado
export const validateUpdateStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status, location } = req.body;

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}` });
  }

  if (!location || location.trim().length < 2) {
    return res.status(400).json({ message: "Ubicación inválida o requerida" });
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

   if (status && !validStatuses.includes(status as string)) {
    return res.status(400).json({ message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}` });
  }

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ message: "Número de página inválido" });
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({ message: "Límite inválido (debe estar entre 1 y 100)" });
  }

  next();
};