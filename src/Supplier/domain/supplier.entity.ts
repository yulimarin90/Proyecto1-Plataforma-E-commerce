export interface Supplier {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: number; // 1 o 0
  created_at?: Date;
  updated_at?: Date;
}