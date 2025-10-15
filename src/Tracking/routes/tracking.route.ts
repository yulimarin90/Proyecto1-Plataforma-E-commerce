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

router.get("/trackings", validateQueryParams, TrackingController.getTrackings);
router.get("/trackings/:id", trackingExistsMiddleware, TrackingController.getTrackingById);
router.get("/trackings/number/:tracking_number", trackingByNumberExistsMiddleware, TrackingController.getTrackingByNumber);
router.get("/orders/:order_id/tracking", TrackingController.getTrackingByOrder);
router.get("/trackings/active", TrackingController.getActiveTrackings);
router.get("/trackings/status/:status", TrackingController.getTrackingsByStatus);


// Rutas protegidas (requieren autenticación de administrador)
router.post(
  "/admin/trackings",
  authMiddleware,
  validateCreateTracking,
  TrackingController.createTracking
);

router.put(
  "/admin/trackings/:tracking_id",
  authMiddleware,
  validateUpdateTracking,
  trackingExistsMiddleware,
  validateActiveTracking,
  TrackingController.updateTracking
);

router.patch(
  "/admin/trackings/:tracking_id/status",
  authMiddleware,
  validateUpdateStatus,
  trackingExistsMiddleware,
  validateActiveTracking,
  TrackingController.updateTrackingStatus
);

router.delete(
  "/admin/trackings/:tracking_id",
  authMiddleware,
  trackingExistsMiddleware,
  validateDeleteTracking,
  TrackingController.deleteTracking
);

router.get("/trackings/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "tracking-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

export default router;