export interface Product {
  id: number;                // Identificador único del producto
  name: string;              // Nombre del producto
  description: string;      // Descripción (opcional)
  price: number;             // Precio unitario
  stock: number;             // Cantidad disponible en inventario
  categoryId: number;        // Relación con la categoría
  createdAt: Date;           // Fecha de creación
  updatedAt: Date;           // Última fecha de actualización
  image: String;       //imagen-url
}

