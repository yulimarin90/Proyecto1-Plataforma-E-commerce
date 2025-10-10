import db from "../../../config/db";
import { Category } from "../../domain/categories.entity";

export interface ICategoriesRepository {
  create(category: Category): Promise<number>;
  findAll(): Promise<Category[]>;
  findById(id: number): Promise<Category | undefined>;
  findByName(name: string): Promise<Category | undefined>;
  update(id: number, category: Partial<Category>): Promise<Category>;
  delete(id: number): Promise<void>;
}

export class CategoriesRepository implements ICategoriesRepository {
  async create(category: Category): Promise<number> {
    const [result] = await db.query(
      `INSERT INTO categories (name, description, is_active, parent_id)
       VALUES (?, ?, ?, ?)`,
      [
        category.name,
        category.description || null,
        Number(category.is_active ?? 1),
        category.parent_id ?? null,
      ]
    );
    return (result as any).insertId;
  }

  async findAll(): Promise<Category[]> {
    const [rows] = await db.query(`SELECT * FROM categories`);
    return rows as Category[];
  }

  async findById(id: number): Promise<Category | undefined> {
    const [rows] = await db.query(`SELECT * FROM categories WHERE id=?`, [id]);
    return (rows as Category[])[0];
  }

  async findByName(name: string): Promise<Category | undefined> {
    const [rows] = await db.query(`SELECT * FROM categories WHERE name=?`, [name]);
    return (rows as Category[])[0];
  }

  async update(id: number, category: Partial<Category>): Promise<Category> {
    const fields: string[] = [];
    const values: any[] = [];

    if (category.name !== undefined) {
      fields.push("name=?");
      values.push(category.name);
    }
    if (category.description !== undefined) {
      fields.push("description=?");
      values.push(category.description);
    }
    if (category.is_active !== undefined) {
      fields.push("is_active=?");
      values.push(Number(category.is_active));
    }
    if (category.parent_id !== undefined) {
      fields.push("parent_id=?");
      values.push(category.parent_id);
    }

    if (fields.length === 0) throw { status: 400, message: "No hay campos para actualizar" };

    values.push(id);
    await db.query(`UPDATE categories SET ${fields.join(", ")} WHERE id=?`, values);
    return this.findById(id) as Promise<Category>;
  }

  async delete(id: number): Promise<void> {
    await db.query(`DELETE FROM categories WHERE id=?`, [id]);
  }
}
