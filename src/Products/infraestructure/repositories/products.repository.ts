import db from "../../../config/db";
import { Product } from "../../domain/products.entity";

export interface IProductsRepository {
  create(product: Product): Promise<number>;
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | undefined>;
  findByNombre(name: string): Promise<Product | undefined>;
  update(id: number, product: Partial<Product>): Promise<Product>;
  delete(id: number): Promise<void>;
  findByCategory(categoryId: number): Promise<Product[]>;
  findFiltered(page: number,limit: number,search?: string): Promise<{ products: Product[]; total: number }>;
}

export class ProductsRepository implements IProductsRepository {
  async create(product: Product): Promise<number> {
    const [result] = await db.query(
      `INSERT INTO products 
      (id, name, description, price, stock, sku, category_id, image_url, is_active, is_discontinued) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.description,
        product.price,
        product.stock,
        product.sku,
        product.category_id,
        product.image_url || null,
        Number(product.is_active),
    Number(product.is_discontinued),
      ]
    );
    return (result as any).insertId;
  }

  async findAll(): Promise<Product[]> {
    const [rows] = await db.query(`SELECT * FROM products`);
    return rows as Product[];
  }

  async findById(id: number): Promise<Product | undefined> {
    const [rows] = await db.query(`SELECT * FROM products WHERE id = ?`, [id]);
    return (rows as Product[])[0];
  }

  async findByNombre(nombre: string): Promise<Product | undefined> {
    const [rows] = await db.query(`SELECT * FROM products WHERE name = ?`, [nombre]);
    return (rows as Product[])[0];
  }

  async update(id: number, product: Partial<Product>): Promise<Product> {
  const fields: string[] = [];
  const values: any[] = [];

  if (product.name !== undefined) {
    fields.push("name = ?");
    values.push(product.name);
  }
  if (product.description !== undefined) {
    fields.push("description = ?");
    values.push(product.description);
  }
  if (product.price !== undefined) {
    fields.push("price = ?");
    values.push(product.price);
  }
  if (product.sku !== undefined) {
    fields.push("sku = ?");
    values.push(product.sku);
  }
  if (product.category_id !== undefined) {
    fields.push("category_id = ?");
    values.push(product.category_id);
  }
  if (product.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(product.image_url);
  }
  if (product.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(Number(product.is_active));
  }
  if (product.is_discontinued !== undefined) {
    fields.push("is_discontinued = ?");
    values.push(Number(product.is_discontinued));
  }

  if (fields.length === 0) throw { status: 400, message: "No hay campos para actualizar" };

  values.push(id);
  const sql = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;
  await db.query(sql, values);

  return this.findById(id) as Promise<Product>;
}

  async delete(id: number): Promise<void> {
    await db.query(`DELETE FROM products WHERE id=?`, [id]);
  }

  async updateStock(productId: number, newStock: number): Promise<void> {
  await db.query(`UPDATE products SET stock = ? WHERE id = ?`, [newStock, productId]);
}


  async findByCategory(categoryId: number): Promise<Product[]> {
    const [rows] = await db.query(`SELECT * FROM products WHERE category_id=?`, [categoryId]);
    return rows as Product[];
  }

  //paginacion
  async findFiltered(
  page: number,
  limit: number,
  search?: string
): Promise<{ products: Product[]; total: number }> {
  const offset = (page - 1) * limit;
  const filters: string[] = [
    "is_active = 1",
    "stock > 0",
    "image_url IS NOT NULL",
    "is_discontinued = 0"
  ];
  const values: any[] = [];

  if (search) {
    filters.push("name LIKE ?");
    values.push(`%${search}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  
  const [rows] = await db.query(
    `
          SELECT 
      name, 
      description, 
      ROUND(price, 2) AS price, 
      image_url
    FROM products
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [countRows]: any = await db.query(
    `SELECT COUNT(*) as total FROM products ${whereClause}`,
    values
  );

  return { products: rows as Product[], total: countRows[0].total };
}

}


