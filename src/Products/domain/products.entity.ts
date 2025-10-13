// products/domain/products.entity.ts
export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: number;
  category_id: number;
  is_active: string;  
  image_url?: string;
  created_at?: Date;
  updated_at?: Date;
  is_discontinued?: number;
}
