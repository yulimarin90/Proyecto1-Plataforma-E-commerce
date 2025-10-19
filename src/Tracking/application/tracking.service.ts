import { TrackingRepository, ITrackingRepository } from "../infraestructure/repositories/tracking.repository";
import { Tracking, TrackingNotification } from "../domain/tracking.entity";
import db from "../../config/db";
import { RowDataPacket } from "mysql2/promise";

export class TrackingService {
  constructor(private trackingRepository: ITrackingRepository) {}

  async createTracking(tracking: Tracking) {
    const existsByOrder = await this.trackingRepository.findByOrderId(tracking.order_id);
    if (existsByOrder) throw { status: 409, message: "Ya existe un tracking para esta orden" };

    const existsByNumber = await this.trackingRepository.findByTrackingNumber(tracking.tracking_number);
    if (existsByNumber) throw { status: 409, message: "El número de tracking ya existe" };

    const id = await this.trackingRepository.create(tracking);
    return await this.trackingRepository.findById(id);
  }

  async getAllTrackings() {
    return await this.trackingRepository.findAll();
  }

  async getTrackingById(id: number) {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };
    return tracking;
  }

  async getTrackingByNumber(trackingNumber: string) {
    const tracking = await this.trackingRepository.findByTrackingNumber(trackingNumber);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };
    return tracking;
  }

  async getTrackingByOrder(orderId: number) {
    const tracking = await this.trackingRepository.findByOrderId(orderId);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado para esta orden" };
    return tracking;
  }

  async updateTracking(id: number, data: Partial<Tracking>) {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };

    if (data.tracking_number && data.tracking_number !== tracking.tracking_number) {
      const exists = await this.trackingRepository.findByTrackingNumber(data.tracking_number);
      if (exists) throw { status: 409, message: "Número de tracking ya en uso" };
    }

    return await this.trackingRepository.update(id, { ...tracking, ...data });
  }

  async deleteTracking(id: number): Promise<void> {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };
    await this.trackingRepository.delete(id);
  }

  async updateTrackingStatus(id: number, status: Tracking['status'], location: string, notes?: string) {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };

    // Validar duración máxima en estado PREPARING
    if (tracking.status === 'preparing') {
      const createdAt = new Date(tracking.created_at!);
      const now = new Date();
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 2) {
        throw { status: 400, message: "La orden no puede permanecer en estado PREPARANDO más de 2 días" };
      }
    }

    if (!this.isValidStatusTransition(tracking.status, status)) {
      throw { status: 400, message: `Transición de estado inválida: de ${tracking.status} a ${status}` };
    }

    // Actualizar tracking
    const updatedTracking = await this.trackingRepository.updateStatus(id, status, location, notes);

    // Obtener user_id desde la orden asociada con tipado correcto
      type OrderRow = RowDataPacket & { user_id: number };
      const [orderRows] = await db.query<OrderRow[]>(`SELECT user_id FROM orders WHERE id = ?`, [tracking.order_id]);
      const userId = orderRows[0]?.user_id;

    // Crear notificación
    const notification: TrackingNotification = {
      tracking_id: id,
      order_id: tracking.order_id,
      tracking_number: tracking.tracking_number,
      status,
      message: this.getStatusMessage(status, location),
      timestamp: new Date(),
    };

    // Insertar notificación en la base de datos
  await db.query(`
    INSERT INTO notifications (user_id, order_id, type, channel, message, status)
    VALUES (?, ?, 'SHIPMENT', 'WEB', ?, 'SENT')
  `, [userId, tracking.order_id, notification.message]);

  // Sincronizar estado de la orden si el tracking fue entregado
  if (status === 'delivered') {
    await db.query(`UPDATE orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [tracking.order_id]);
  }

  // Emitir eventos WebSocket desde el servicio (si el socket esté disponible)
  const io = (globalThis as any).io; // Asegúrate de que el socket esté accesible globalmente
  if (io) {
    io.to(`order_${tracking.order_id}`).emit('order_tracking_update', {
      tracking: updatedTracking,
      notification
    });

    if (status === 'delivered') {
      io.to(`order_${tracking.order_id}`).emit('order_delivered', {
        orderId: tracking.order_id,
        trackingId: tracking.id,
        message: 'La orden ha sido entregada',
        timestamp: new Date().toISOString()
      });
    }

    if (status === 'cancelled') {
      io.to(`order_${tracking.order_id}`).emit('order_cancelled', {
        orderId: tracking.order_id,
        trackingId: tracking.id,
        message: 'La orden ha sido cancelada',
        timestamp: new Date().toISOString()
      });
    }
  }

  return { tracking: updatedTracking, notification };
}  

  async getActiveTrackings() {
    return await this.trackingRepository.getActiveTrackings();
  }

  async getTrackingsByStatus(status: Tracking['status']) {
    return await this.trackingRepository.getTrackingsByStatus(status);
  }

  async generateTrackingNumber(): Promise<string> {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 90000) + 10000;
    const trackingNumber = `TRK-${yyyymmdd}-${random}`;

    const exists = await this.trackingRepository.findByTrackingNumber(trackingNumber);
    if (exists) return this.generateTrackingNumber();

    return trackingNumber;
  }

  private isValidStatusTransition(currentStatus: Tracking['status'], newStatus: Tracking['status']): boolean {
    const validTransitions: Record<Tracking['status'], Tracking['status'][]> = {
      'pending': ['preparing', 'cancelled'],
      'preparing': ['in_transit', 'cancelled'],
      'in_transit': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': [],
      'returned': [],
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private getStatusMessage(status: Tracking['status'], location: string): string {
    const messages: Record<Tracking['status'], string> = {
      'pending': 'Tu pedido está pendiente de procesamiento',
      'preparing': 'Tu pedido está siendo preparado',
      'in_transit': `Tu pedido está en tránsito hacia ${location}`,
      'out_for_delivery': `Tu pedido está fuera para entrega en ${location}`,
      'delivered': `Tu pedido ha sido entregado en ${location}`,
      'cancelled': 'Tu pedido ha sido cancelado',
      'returned': 'Tu pedido ha sido devuelto',
    };
    return messages[status] || 'Actualización de estado de tu pedido';
  }

  calculateEstimatedDeliveryDate(carrierName: string, originLocation: string, destinationLocation: string): Date {
    const deliveryTimes: Record<string, number> = {
      'FedEx': 3,
      'UPS': 2,
      'DHL': 2,
      'Correos': 5,
      'Estafeta': 3
    };
    const baseDays = deliveryTimes[carrierName] || 3;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + baseDays);
    return estimatedDate;
  }
}
