export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: string;
  estado: string; // activo / inactivo
  createdAt: Date;
  updatedAt: Date;
}
