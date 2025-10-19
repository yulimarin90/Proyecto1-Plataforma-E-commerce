export interface Tracking {
  user_id: number;
  id?: number;
  order_id: number;
  tracking_number: string;
  status: 'pending' | 'preparing' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  current_location: string;
  estimated_delivery_date?: Date;
  actual_delivery_date?: Date;
  carrier_name: string;
  carrier_phone?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  is_active: number;
}

export interface TrackingUpdate {
  tracking_id: number;
  status: Tracking['status'];
  location: string;
  notes?: string;
  timestamp: Date;
}

export interface TrackingNotification {
  tracking_id: number;
  order_id: number;
  tracking_number: string;
  status: Tracking['status'];
  message: string;
  timestamp: Date;
  recipient_email?: string;
  recipient_phone?: string;
  channel?: 'EMAIL' | 'WEB' | 'PUSH'; // agregado para compatibilidad con tabla
  status_db?: 'SENT' | 'FAILED' | 'PENDING'; // agregado para compatibilidad con tabla
}