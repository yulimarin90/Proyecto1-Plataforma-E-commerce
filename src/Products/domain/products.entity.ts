

// product.entity.ts
export interface Product {
  id?: number;
  nombre: string;
  imagen?: string;          
  descripcion?: string;     
  precio: number;
  stock: number;
  cantidad?: number;        
  categoria_id: number;     
  estado?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
