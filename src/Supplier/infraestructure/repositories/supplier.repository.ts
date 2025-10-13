import db from "../../../config/db";
import { Supplier } from "../../domain/supplier.entity";

export interface ISuppliersRepository {
  create(supplier: Supplier): Promise<number>;
  findAll(): Promise<Supplier[]>;
  findById(id: number): Promise<Supplier | undefined>;
  findByName(name: string): Promise<Supplier | undefined>;
  update(id: number, supplier: Partial<Supplier>): Promise<Supplier>;
  delete(id: number): Promise<void>;
}

export class SuppliersRepository implements ISuppliersRepository {
  async create(supplier: Supplier): Promise<number> {
    const [result] = await db.query(
      `INSERT INTO suppliers (name, email, phone, address, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        supplier.name,
        supplier.email || null,
        supplier.phone || null,
        supplier.address || null,
        Number(supplier.is_active ?? 1),
      ]
    );
    return (result as any).insertId;
  }

  async findAll(): Promise<Supplier[]> {
    const [rows] = await db.query(`SELECT * FROM suppliers`);
    return rows as Supplier[];
  }

  async findById(id: number): Promise<Supplier | undefined> {
    const [rows] = await db.query(`SELECT * FROM suppliers WHERE id=?`, [id]);
    return (rows as Supplier[])[0];
  }

  async findByName(name: string): Promise<Supplier | undefined> {
    const [rows] = await db.query(`SELECT * FROM suppliers WHERE name=?`, [name]);
    return (rows as Supplier[])[0];
  }

  async update(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    const fields: string[] = [];
    const values: any[] = [];

    if (supplier.name !== undefined) { fields.push("name=?"); values.push(supplier.name); }
    if (supplier.email !== undefined) { fields.push("email=?"); values.push(supplier.email); }
    if (supplier.phone !== undefined) { fields.push("phone=?"); values.push(supplier.phone); }
    if (supplier.address !== undefined) { fields.push("address=?"); values.push(supplier.address); }
    if (supplier.is_active !== undefined) { fields.push("is_active=?"); values.push(Number(supplier.is_active)); }

    if (fields.length === 0) throw { status: 400, message: "No hay campos para actualizar" };

    values.push(id);
    const sql = `UPDATE suppliers SET ${fields.join(", ")} WHERE id=?`;
    await db.query(sql, values);

    return this.findById(id) as Promise<Supplier>;
  }

  async delete(id: number): Promise<void> {
    await db.query(`DELETE FROM suppliers WHERE id=?`, [id]);
  }
}