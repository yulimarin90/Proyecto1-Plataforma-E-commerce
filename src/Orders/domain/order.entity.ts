

// order.entity.ts
export interface Order {
  id?: number;
  user_id: number;             
  payment_method: string;      
  shipping_address: string;    
  status?: string;
  cancel_reason?: string;      
  tracking?: any;
  created_at?: Date;
  updated_at?: Date;
}
