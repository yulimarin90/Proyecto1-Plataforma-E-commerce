export interface Category {
  id?: number;
  name: string;
  description?: string;
  is_active?: number; // 1 o 0
  parent_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}
