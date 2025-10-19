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

// WebSocket para notificaciones en tiempo real
export const initializeTrackingSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log('Cliente conectado al sistema de tracking:', socket.id);

    socket.on('join_tracking', (trackingId: number) => {
      socket.join(`tracking_${trackingId}`);
      console.log(`Cliente ${socket.id} se unió a la sala del tracking ${trackingId}`);
    });

    socket.on('join_order', (orderId: number) => {
      socket.join(`order_${orderId}`);
      console.log(`Cliente ${socket.id} se unió a la sala de la orden ${orderId}`);
    });

    socket.on('request_tracking_update', async (data: { trackingId: number }) => {
      try {
        const tracking = await trackingService.getTrackingById(data.trackingId);
        socket.emit('tracking_current_status', tracking);
      } catch (error) {
        socket.emit('error', { message: 'Error al obtener estado del tracking' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado del sistema de tracking:', socket.id);
    });
  });

  setInterval(async () => {
    try {
      const activeTrackings = await trackingService.getActiveTrackings();
      io.emit('active_trackings_update', activeTrackings);
    } catch (error) {
      console.error('Error en actualización periódica de trackings:', error);
    }
  }, 30000);
};

// Rutas públicas (requieren autenticación para validar propiedad)
router.get("/trackings", authMiddleware, validateQueryParams, TrackingController.getTrackings);
router.get("/trackings/:id", authMiddleware, trackingExistsMiddleware, TrackingController.getTrackingById);
router.get("/trackings/number/:tracking_number", authMiddleware, trackingByNumberExistsMiddleware, TrackingController.getTrackingByNumber);
router.get("/orders/:order_id/tracking", authMiddleware, TrackingController.getTrackingByOrder);
router.get("/trackings/active", authMiddleware, TrackingController.getActiveTrackings);
router.get("/trackings/status/:status", authMiddleware, TrackingController.getTrackingsByStatus);

// Rutas protegidas (modificación de datos)
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

// Ruta de salud del servicio
router.get("/trackings/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "tracking-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

export default router;
