import { TrackingRepository, ITrackingRepository } from "../infraestructure/repositories/tracking.repository";
import { Tracking, TrackingUpdate, TrackingNotification } from "../domain/tracking.entity";

export class TrackingService {
  constructor(private trackingRepository: ITrackingRepository) {}

  // Crear tracking
  async createTracking(tracking: Tracking) {
    const existsByOrder = await this.trackingRepository.findByOrderId(tracking.order_id);
    if (existsByOrder) throw { status: 409, message: "Ya existe un tracking para esta orden" };

    const existsByNumber = await this.trackingRepository.findByTrackingNumber(tracking.tracking_number);
    if (existsByNumber) throw { status: 409, message: "El número de tracking ya existe" };

    const id = await this.trackingRepository.create(tracking);
    return await this.trackingRepository.findById(id);
  }

  // Obtener todos los trackings
  async getAllTrackings() {
    return await this.trackingRepository.findAll();
  }

  // Obtener tracking por ID
  async getTrackingById(id: number) {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };
    return tracking;
  }

  // Obtener tracking por número de seguimiento
  async getTrackingByNumber(trackingNumber: string) {
    const tracking = await this.trackingRepository.findByTrackingNumber(trackingNumber);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };
    return tracking;
  }

  // Obtener tracking por orden
  async getTrackingByOrder(orderId: number) {
    const tracking = await this.trackingRepository.findByOrderId(orderId);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado para esta orden" };
    return tracking;
  }

  // Actualizar tracking
  async updateTracking(id: number, data: Partial<Tracking>) {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };

    if (data.tracking_number && data.tracking_number !== tracking.tracking_number) {
      const exists = await this.trackingRepository.findByTrackingNumber(data.tracking_number);
      if (exists) throw { status: 409, message: "Número de tracking ya en uso" };
    }

    return await this.trackingRepository.update(id, { ...tracking, ...data });
  }

  // Eliminar tracking
  async deleteTracking(id: number): Promise<void> {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };

    await this.trackingRepository.delete(id);
  }

  // Actualizar estado del tracking
  async updateTrackingStatus(id: number, status: Tracking['status'], location: string, notes?: string) {
    const tracking = await this.trackingRepository.findById(id);
    if (!tracking) throw { status: 404, message: "Tracking no encontrado" };

    // Validar transición de estados
    if (!this.isValidStatusTransition(tracking.status, status)) {
      throw { 
        status: 400, 
        message: `Transición de estado inválida: de ${tracking.status} a ${status}` 
      };
    }

    const updatedTracking = await this.trackingRepository.updateStatus(id, status, location, notes);
    
    // Crear notificación para el cliente
    const notification: TrackingNotification = {
      tracking_id: id,
      order_id: tracking.order_id,
      tracking_number: tracking.tracking_number,
      status,
      message: this.getStatusMessage(status, location),
      timestamp: new Date(),
    };

    return { tracking: updatedTracking, notification };
  }

  // Obtener trackings activos
  async getActiveTrackings() {
    return await this.trackingRepository.getActiveTrackings();
  }

  // Obtener trackings por estado
  async getTrackingsByStatus(status: Tracking['status']) {
    return await this.trackingRepository.getTrackingsByStatus(status);
  }

  // Generar número de tracking único
  async generateTrackingNumber(): Promise<string> {
    const prefix = "TRK";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const trackingNumber = `${prefix}${timestamp}${random}`;

    const exists = await this.trackingRepository.findByTrackingNumber(trackingNumber);
    if (exists) {
      return this.generateTrackingNumber(); // Recursión si ya existe
    }

    return trackingNumber;
  }

  // Validar transición de estados
  private isValidStatusTransition(currentStatus: Tracking['status'], newStatus: Tracking['status']): boolean {
    const validTransitions: Record<Tracking['status'], Tracking['status'][]> = {
      'pending': ['in_transit', 'cancelled'],
      'in_transit': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'in_transit', 'cancelled'],
      'delivered': ['returned'],
      'cancelled': [],
      'returned': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Generar mensaje de estado
  private getStatusMessage(status: Tracking['status'], location: string): string {
    const messages: Record<Tracking['status'], string> = {
      'pending': 'Tu pedido está siendo preparado',
      'in_transit': `Tu pedido está en tránsito hacia ${location}`,
      'out_for_delivery': `Tu pedido está fuera para entrega en ${location}`,
      'delivered': `Tu pedido ha sido entregado en ${location}`,
      'cancelled': 'Tu pedido ha sido cancelado',
      'returned': 'Tu pedido ha sido devuelto'
    };

    return messages[status] || 'Actualización de estado de tu pedido';
  }

  // Calcular fecha estimada de entrega
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