

export type OrderStatus =
  | 'PENDIENTE'
  | 'PREPARANDO'
  | 'EN_TRANSITO'
  | 'EN_ENTREGA'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface Order {
  id?: number;
  order_number?: string;             
  user_id: number;
  total_amount: number;

  shipping_address: string;
  shipping_method?: string;
  payment_method: string;
  notes?: string;

  status?: OrderStatus;
  cancellation_reason?: string;
}