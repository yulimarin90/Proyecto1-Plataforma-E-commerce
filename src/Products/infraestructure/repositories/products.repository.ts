// products/infraestructure/repositories/products.repository.ts
import { db } from "../../../config/db";
import { Product } from "../../domain/products.entity";

export class ProductsRepository {
  static async create(product: Product) {
    const [result] = await db.query(
      `INSERT INTO products 
        (id, name, description, price, stock, sku, category_id, image_url, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.description,
        product.price,
        product.stock,
        product.sku,
        product.category_id,
        product.is_active || "active",
        product.image_url || null,
      ]
    );
    return (result as any).insertId;
  }

  static async findAll() {
    const [rows] = await db.query(`SELECT * FROM products`);
    return rows as Product[];
  }

  static async findById(id: number) {
    const [rows] = await db.query(`SELECT * FROM products WHERE id = ?`, [id]);
    return (rows as Product[])[0];
  }

  static async findByNombre(nombre: string) {
    const [rows] = await db.query(`SELECT * FROM products WHERE name = ?`, [this.name]);
    return (rows as Product[])[0];
  }

  static async update(id: number, product: Partial<Product>) {
    await db.query(
      `UPDATE products SET name=?, description=?, price=?, sku=?, category_id=?, image_url=?, is_active=? WHERE id=?`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.sku,
        product.category_id,
        product.is_active || "active",
        product.image_url || null,
        id,
      ]
    );
    return this.findById(id);
  }

  static async delete(id: number) {
    await db.query(`DELETE FROM products WHERE id=?`, [id]);
  }

  static async findByCategory(categoryId: number) {
    const [rows] = await db.query(`SELECT * FROM products WHERE category_id=?`, [categoryId]);
    return rows as Product[];
  }
}
