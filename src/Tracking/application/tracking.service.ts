import { TrackingRepository, ITrackingRepository } from "../infraestructure/repositories/tracking.repository";
import { Tracking, TrackingNotification } from "../domain/tracking.entity";
import db from "../../config/db";
import { RowDataPacket } from "mysql2/promise";

export class TrackingService {
  constructor(private trackingRepository: ITrackingRepository) {}

  async createTracking(tracking: Tracking) {
    // 1️⃣ Validar orden
    type OrderRow = RowDataPacket & { id: number; status: string; user_id: number };
    const [orderRows] = await db.query<OrderRow[]>(`SELECT id, status, user_id FROM orders WHERE id = ?`, [tracking.order_id]);
    const order = orderRows[0];
    if (!order) throw { status: 404, message: "La orden asociada no existe" };
   if (["CANCELADO", "CANCELLED"].includes(order.status.toUpperCase())) {
  throw { status: 400, message: "No se puede crear un tracking para una orden cancelada" };
}

  if (tracking.is_active === undefined || tracking.is_active === null) {
    tracking.is_active = 1;   // ← ⚡ AQUÍ VA ESTA LÍNEA
  }

    // 2️⃣ Validar existencia previa
    const existsByOrder = await this.trackingRepository.findByOrderId(tracking.order_id);
    if (existsByOrder) throw { status: 409, message: "Ya existe un tracking para esta orden" };

    const existsByNumber = await this.trackingRepository.findByTrackingNumber(tracking.tracking_number);
    if (existsByNumber) throw { status: 409, message: "El número de tracking ya existe" };

  
    // 3️⃣ Crear tracking
    const id = await this.trackingRepository.create(tracking);
    const created = await this.trackingRepository.findById(id);

    // 🩶 Aquí aseguramos que existe el registro
  if (!created) throw { status: 500, message: "Error interno: el tracking recién creado no se encontró" };

    // 4️⃣ Registrar notificación (solo lo comunica, no lo hace directamente)
    return { created, orderUserId: order.user_id };
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

  async updateTrackingStatus(
  id: number,
  newStatus: string,
  location?: string,
  notes?: string
) {
  // 🔍 Buscar tracking
  const tracking = await this.trackingRepository.findById(id);
  if (!tracking) {
    throw { status: 404, message: "Tracking no encontrado" };
  }

  // ⚙️ Validar estados válidos
  const validStates = [
    "pending",
    "preparing",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  if (!validStates.includes(newStatus.toLowerCase())) {
    throw { status: 400, message: `Estado inválido: ${newStatus}` };
  }

  // 🧩 Cancelación: solo si está pendiente
  if (["cancelado", "cancelled"].includes(newStatus.toLowerCase())) {
    if (tracking.status === "pending") {
      await this.trackingRepository.update(id, {
        status: "cancelled",
        is_active: 0,
        updated_at: new Date(),
      });
      return await this.trackingRepository.findById(id);
    } else {
      throw {
        status: 400,
        message: "No se puede cancelar un tracking en estado avanzado",
      };
    }
  }

  // 🚫 Evitar retroceder estados
  const order = [
    "pending",
    "preparing",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  const currentIndex = order.indexOf(tracking.status);
  const newIndex = order.indexOf(newStatus);
  if (newIndex < currentIndex) {
    throw {
      status: 400,
      message: `No se puede retroceder de ${tracking.status} a ${newStatus}`,
    };
  }

  // 🚫 Bloquear modificaciones si ya fue entregado
  if (tracking.status === "delivered") {
    throw {
      status: 400,
      message: "El tracking ya fue entregado y no puede modificarse",
    };
  }

 // ✅ Actualizar tracking sin tocar campos obligatorios

const updateData: Partial<Tracking> = {
  status: newStatus as Tracking["status"],
  current_location: location ?? tracking.current_location,
  notes: (notes ?? tracking.notes) as string, // fuerza string
  updated_at: new Date(),
};


await this.trackingRepository.update(id, updateData);


  // Retornar actualizado
  return await this.trackingRepository.findById(id);
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
