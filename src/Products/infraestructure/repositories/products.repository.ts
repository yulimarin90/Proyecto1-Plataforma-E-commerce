
import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../../../config/db";
import { Product } from "../../domain/products.entity";


export class ProductRepository {
  // Crear un producto
  static async create(product: Product) {
    const [result]: any = await db.query(
      `INSERT INTO products 
        (nombre, imagen, descripcion, precio, stock, cantidad, categoria_id, estado, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        product.nombre,
        product.imagen || null,
        product.descripcion || null,
        product.precio,
        product.stock,
        product.cantidad ?? 0,
        product.categoria_id,
        product.estado ?? true,
      ]
    );
    return { id: result.insertId, ...product };
  }

  // Listar todos los productos
  static async findAll(): Promise<Product[]> {
    const [rows]: any = await db.query("SELECT * FROM products");
    return rows;
  }

  // Buscar un producto por ID
  static async findById(id: number): Promise<Product | null> {
    const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Actualizar un producto
  static async update(id: number, product: Partial<Product>) {
    const [result]: any = await db.query(
      `UPDATE products 
       SET nombre=?, imagen=?, descripcion=?, precio=?, stock=?, cantidad=?, categoria_id=?, estado=?, updated_at=NOW()
       WHERE id=?`,
      [
        product.nombre,
        product.imagen,
        product.descripcion,
        product.precio,
        product.stock,
        product.cantidad,
        product.categoria_id,
        product.estado,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  // Eliminar un producto
  static async delete(id: number) {
    const [result]: any = await db.query("DELETE FROM products WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

