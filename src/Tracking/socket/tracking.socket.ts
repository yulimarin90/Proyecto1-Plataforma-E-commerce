import { Server as SocketIOServer } from 'socket.io';
import { Namespace } from "socket.io";
import { TrackingService } from '../application/tracking.service';
import { TrackingRepository } from '../infraestructure/repositories/tracking.repository';

const trackingService = new TrackingService(new TrackingRepository());

export interface TrackingSocketData {
  trackingId?: number;
  orderId?: number;
  userId?: string;
}

declare module "socket.io" {
  interface Namespace {
    emitTrackingUpdate?: (trackingId: number, data: any) => void;
    emitNotification?: (notification: any) => void;
  }
}

export const setupTrackingSocket = (io: SocketIOServer) => {
  io.of('/tracking').on('connection', (socket) => {
    console.log('Cliente conectado al namespace de tracking:', socket.id);

    // Unirse a sala de tracking específico
    socket.on('join_tracking', (data: TrackingSocketData) => {
      if (data.trackingId) {
        socket.join(`tracking_${data.trackingId}`);
        console.log(`Cliente ${socket.id} se unió a la sala del tracking ${data.trackingId}`);
        
        // Enviar estado actual del tracking
        trackingService.getTrackingById(data.trackingId)
          .then(tracking => {
            socket.emit('tracking_current_status', {
              tracking,
              timestamp: new Date().toISOString()
            });
          })
          .catch(error => {
            socket.emit('error', { 
              message: 'Error al obtener estado del tracking',
              error: error.message 
            });
          });
      }
    });

    // Unirse a sala de orden específica
    socket.on('join_order', (data: TrackingSocketData) => {
      if (data.orderId) {
        socket.join(`order_${data.orderId}`);
        console.log(`Cliente ${socket.id} se unió a la sala de la orden ${data.orderId}`);
        
        // Enviar tracking actual de la orden
        trackingService.getTrackingByOrder(data.orderId)
          .then(tracking => {
            socket.emit('order_tracking_current', {
              tracking,
              timestamp: new Date().toISOString()
            });
          })
          .catch(error => {
            socket.emit('error', { 
              message: 'Error al obtener tracking de la orden',
              error: error.message 
            });
          });
      }
    });

    // Unirse a sala de usuario específica
    socket.on('join_user', (data: TrackingSocketData) => {
      if (data.userId) {
        socket.join(`user_${data.userId}`);
        console.log(`Cliente ${socket.id} se unió a la sala del usuario ${data.userId}`);
      }
    });

    // Solicitar actualización manual de tracking
    socket.on('request_tracking_update', async (data: { trackingId: number }) => {
      try {
        const tracking = await trackingService.getTrackingById(data.trackingId);
        socket.emit('tracking_current_status', {
          tracking,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        socket.emit('error', { 
          message: 'Error al obtener estado del tracking',
          error: error.message 
        });
      }
    });

    // Solicitar trackings activos
    socket.on('request_active_trackings', async () => {
      try {
        const trackings = await trackingService.getActiveTrackings();
        socket.emit('active_trackings_list', {
          trackings,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        socket.emit('error', { 
          message: 'Error al obtener trackings activos',
          error: error.message 
        });
      }
    });

    // Suscribirse a notificaciones de un estado específico
    socket.on('subscribe_status', (data: { status: string }) => {
      const validStatuses = ['pending', 'preparing', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
      if (validStatuses.includes(data.status)) {
        socket.join(`status_${data.status}`);
        console.log(`Cliente ${socket.id} se suscribió a notificaciones de estado: ${data.status}`);
      } else {
        socket.emit('error', { message: 'Estado inválido para suscripción' });
      }
    });

    // Cancelar suscripción a notificaciones de estado
    socket.on('unsubscribe_status', (data: { status: string }) => {
      socket.leave(`status_${data.status}`);
      console.log(`Cliente ${socket.id} canceló suscripción a estado: ${data.status}`);
    });

    // Enviar ubicación actual (para actualizaciones en tiempo real desde conductores)
    socket.on('update_location', async (data: { 
      trackingId: number; 
      location: string; 
      coordinates?: { lat: number; lng: number } 
    }) => {
      try {
        const tracking = await trackingService.updateTracking(
          data.trackingId, 
          { current_location: data.location }
        );
        
        // Emitir actualización a todos los interesados
        io.of('/tracking').to(`tracking_${data.trackingId}`).emit('location_update', {
          trackingId: data.trackingId,
          location: data.location,
          coordinates: data.coordinates,
          timestamp: new Date().toISOString()
        });

        io.of('/tracking').to(`order_${tracking.order_id}`).emit('order_location_update', {
          trackingId: data.trackingId,
          orderId: tracking.order_id,
          location: data.location,
          coordinates: data.coordinates,
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        socket.emit('error', { 
          message: 'Error al actualizar ubicación',
          error: error.message 
        });
      }
    });

    // Marcar como entregado (confirmación de entrega)
    socket.on('confirm_delivery', async (data: { 
      trackingId: number; 
      signature?: string; 
      notes?: string;
      delivered_by?: string;
    }) => {
      try {
        const result = await trackingService.updateTrackingStatus(
          data.trackingId, 
          'delivered', 
          'Entregado',
          data.notes
        );

        // Emitir notificación de entrega
        const notification = {
          type: 'delivery_confirmed',
          trackingId: data.trackingId,
          orderId: result.tracking.order_id,
          trackingNumber: result.tracking.tracking_number,
          message: '¡Entrega confirmada!',
          timestamp: new Date().toISOString(),
          signature: data.signature,
          delivered_by: data.delivered_by
        };

        io.of('/tracking').to(`tracking_${data.trackingId}`).emit('delivery_confirmed', notification);
        io.of('/tracking').to(`order_${result.tracking.order_id}`).emit('order_delivered', notification);
        io.of('/tracking').emit('global_delivery_update', notification);

      } catch (error: any) {
        socket.emit('error', { 
          message: 'Error al confirmar entrega',
          error: error.message 
        });
      }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('Cliente desconectado del namespace de tracking:', socket.id);
    });

    // Enviar mensaje de bienvenida
    socket.emit('connected', {
      message: 'Conectado al sistema de tracking en tiempo real',
      timestamp: new Date().toISOString(),
      available_events: [
        'join_tracking',
        'join_order', 
        'join_user',
        'request_tracking_update',
        'request_active_trackings',
        'subscribe_status',
        'unsubscribe_status',
        'update_location',
        'confirm_delivery'
      ]
    });
  });

  // Eventos periódicos para actualizaciones automáticas
  setInterval(async () => {
    try {
      const activeTrackings = await trackingService.getActiveTrackings();
      io.of('/tracking').emit('active_trackings_update', {
        trackings: activeTrackings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en actualización periódica de trackings:', error);
    }
  }, 60000); // Cada minuto

  // Función para emitir actualización de tracking (llamada desde el controller)
  io.of('/tracking').emitTrackingUpdate = (trackingId: number, data: any) => {
    io.of('/tracking').to(`tracking_${trackingId}`).emit('tracking_update', {
      trackingId,
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Función para emitir notificación general
  io.of('/tracking').emitNotification = (notification: any) => {
    io.of('/tracking').emit('tracking_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  };

  return io.of('/tracking');
};