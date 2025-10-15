import { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import * as TrackingController from "../infraestructure/controllers/tracking.controller";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import {
  trackingExistsMiddleware,
  trackingByNumberExistsMiddleware,
  validateCreateTracking,
  validateUpdateTracking,
  validateUpdateStatus,
  validateActiveTracking,
  validateDeleteTracking,
  validateQueryParams
} from "../infraestructure/middlewares/tracking.middleware";
import { TrackingService } from "../application/tracking.service";
import { TrackingRepository } from "../infraestructure/repositories/tracking.repository";

const trackingService = new TrackingService(new TrackingRepository());
const router = Router();

// Configuración de WebSocket para notificaciones en tiempo real
export const initializeTrackingSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log('Cliente conectado al sistema de tracking:', socket.id);

    // Unirse a sala de tracking específico
    socket.on('join_tracking', (trackingId: number) => {
      socket.join(`tracking_${trackingId}`);
      console.log(`Cliente ${socket.id} se unió a la sala del tracking ${trackingId}`);
    });

    // Unirse a sala de orden específica
    socket.on('join_order', (orderId: number) => {
      socket.join(`order_${orderId}`);
      console.log(`Cliente ${socket.id} se unió a la sala de la orden ${orderId}`);
    });

    // Solicitar actualización de tracking
    socket.on('request_tracking_update', async (data: { trackingId: number }) => {
      try {
        // Estado actual del tracking
         const tracking = await trackingService.getTrackingById(data.trackingId);
         socket.emit('tracking_current_status', tracking);
      } catch (error) {
        socket.emit('error', { message: 'Error al obtener estado del tracking' });
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log('Cliente desconectado del sistema de tracking:', socket.id);
    });
  });

  
  setInterval(async () => {
    try {
      // Se emiten actualizaciones de trackings activos
       const activeTrackings = await trackingService.getActiveTrackings();
       io.emit('active_trackings_update', activeTrackings);
    } catch (error) {
      console.error('Error en actualización periódica de trackings:', error);
    }
  }, 30000); // Para cada 30 segundos
};

// Rutas públicas (no requieren autenticación)
// Obtener todos los trackings con filtros y paginación
router.get("/trackings", validateQueryParams, TrackingController.getTrackings);

// Obtener tracking por ID
router.get("/trackings/:id", trackingExistsMiddleware, TrackingController.getTrackingById);

// Obtener tracking por número de seguimiento
router.get("/trackings/number/:tracking_number", trackingByNumberExistsMiddleware, TrackingController.getTrackingByNumber);

// Obtener tracking por orden
router.get("/orders/:order_id/tracking", TrackingController.getTrackingByOrder);

// Obtener trackings activos
router.get("/trackings/active", TrackingController.getActiveTrackings);

// Obtener trackings por estado
router.get("/trackings/status/:status", TrackingController.getTrackingsByStatus);


// Rutas protegidas (requieren autenticación de administrador)
// Crear tracking
router.post(
  "/admin/trackings",
  authMiddleware,
  validateCreateTracking,
  TrackingController.createTracking
);

// Actualizar tracking completo
router.put(
  "/admin/trackings/:tracking_id",
  authMiddleware,
  validateUpdateTracking,
  trackingExistsMiddleware,
  validateActiveTracking,
  TrackingController.updateTracking
);

// Actualizar estado del tracking (endpoint principal para actualizaciones en tiempo real)
router.patch(
  "/admin/trackings/:tracking_id/status",
  authMiddleware,
  validateUpdateStatus,
  trackingExistsMiddleware,
  validateActiveTracking,
  TrackingController.updateTrackingStatus
);

// Eliminar tracking
router.delete(
  "/admin/trackings/:tracking_id",
  authMiddleware,
  trackingExistsMiddleware,
  validateDeleteTracking,
  TrackingController.deleteTracking
);

// Endpoint para health check del servicio de tracking
router.get("/trackings/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "tracking-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});


// Endpoint para bulk update de estados (actualización masiva)
router.post(
  "/admin/trackings/bulk-update",
  authMiddleware,
  async (req, res) => {
    try {
      const { tracking_ids, status, location, notes } = req.body;

      if (!tracking_ids || !Array.isArray(tracking_ids) || tracking_ids.length === 0) {
        return res.status(400).json({ message: "Lista de IDs de tracking requerida" });
      }

      if (!status || !['pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(status)) {
        return res.status(400).json({ 
          message: "Estado inválido. Estados válidos: pending, in_transit, out_for_delivery, delivered, cancelled, returned" 
        });
      }

      if (!location || location.trim().length < 2) {
        return res.status(400).json({ message: "Ubicación inválida o requerida" });
      }

      const results = [];
      for (const trackingId of tracking_ids) {
        try {
          const result = await trackingService.updateTrackingStatus(trackingId, status, location, notes);
          results.push({ tracking_id: trackingId, success: true, result });
        } catch (error) {
          if (error instanceof Error) {
            results.push({ tracking_id: trackingId, success: false, error: error.message });
          } else {
            results.push({ tracking_id: trackingId, success: false, error: String(error) });
          }
        }
      }

      res.status(200).json({
        message: "Actualización masiva completada",
        results,
        total_processed: tracking_ids.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error en actualización masiva" });
    }
  }
);

export default router;