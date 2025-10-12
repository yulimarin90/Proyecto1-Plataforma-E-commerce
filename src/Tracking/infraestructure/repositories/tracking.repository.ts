import db from "../../../config/db";
import { Tracking, TrackingUpdate, TrackingNotification } from "../../domain/tracking.entity";

export interface ITrackingRepository {
  create(tracking: Tracking): Promise<number>;
  findAll(): Promise<Tracking[]>;
  findById(id: number): Promise<Tracking | undefined>;
  findByOrderId(orderId: number): Promise<Tracking | undefined>;
  findByTrackingNumber(trackingNumber: string): Promise<Tracking | undefined>;
  update(id: number, tracking: Partial<Tracking>): Promise<Tracking>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, status: Tracking['status'], location: string, notes?: string): Promise<Tracking>;
  getActiveTrackings(): Promise<Tracking[]>;
  getTrackingsByStatus(status: Tracking['status']): Promise<Tracking[]>;
}

export class TrackingRepository implements ITrackingRepository {
  async create(tracking: Tracking): Promise<number> {
    const [result] = await db.query(
      `INSERT INTO trackings 
      (order_id, tracking_number, status, current_location, estimated_delivery_date, 
       actual_delivery_date, carrier_name, carrier_phone, notes, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tracking.order_id,
        tracking.tracking_number,
        tracking.status,
        tracking.current_location,
        tracking.estimated_delivery_date || null,
        tracking.actual_delivery_date || null,
        tracking.carrier_name,
        tracking.carrier_phone || null,
        tracking.notes || null,
        Number(tracking.is_active),
      ]
    );
    return (result as any).insertId;
  }

  async findAll(): Promise<Tracking[]> {
    const [rows] = await db.query(`SELECT * FROM trackings ORDER BY created_at DESC`);
    return rows as Tracking[];
  }

  async findById(id: number): Promise<Tracking | undefined> {
    const [rows] = await db.query(`SELECT * FROM trackings WHERE id = ?`, [id]);
    return (rows as Tracking[])[0];
  }

  async findByOrderId(orderId: number): Promise<Tracking | undefined> {
    const [rows] = await db.query(`SELECT * FROM trackings WHERE order_id = ?`, [orderId]);
    return (rows as Tracking[])[0];
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Tracking | undefined> {
    const [rows] = await db.query(`SELECT * FROM trackings WHERE tracking_number = ?`, [trackingNumber]);
    return (rows as Tracking[])[0];
  }

  async update(id: number, tracking: Partial<Tracking>): Promise<Tracking> {
    const fields: string[] = [];
    const values: any[] = [];

    if (tracking.status !== undefined) {
      fields.push("status = ?");
      values.push(tracking.status);
    }
    if (tracking.current_location !== undefined) {
      fields.push("current_location = ?");
      values.push(tracking.current_location);
    }
    if (tracking.estimated_delivery_date !== undefined) {
      fields.push("estimated_delivery_date = ?");
      values.push(tracking.estimated_delivery_date);
    }
    if (tracking.actual_delivery_date !== undefined) {
      fields.push("actual_delivery_date = ?");
      values.push(tracking.actual_delivery_date);
    }
    if (tracking.carrier_name !== undefined) {
      fields.push("carrier_name = ?");
      values.push(tracking.carrier_name);
    }
    if (tracking.carrier_phone !== undefined) {
      fields.push("carrier_phone = ?");
      values.push(tracking.carrier_phone);
    }
    if (tracking.notes !== undefined) {
      fields.push("notes = ?");
      values.push(tracking.notes);
    }
    if (tracking.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(Number(tracking.is_active));
    }

    if (fields.length === 0) throw { status: 400, message: "No hay campos para actualizar" };

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    const sql = `UPDATE trackings SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    return this.findById(id) as Promise<Tracking>;
  }

  async delete(id: number): Promise<void> {
    await db.query(`DELETE FROM trackings WHERE id=?`, [id]);
  }

  async updateStatus(id: string | number, status: Tracking['status'], location: string, notes?: string): Promise<Tracking> {
    const numericId = Number(id);
    const fields = ["status = ?", "current_location = ?", "updated_at = CURRENT_TIMESTAMP"];
    const values: any[] = [status, location];

    if (notes !== undefined) {
      fields.push("notes = ?");
      values.push(notes);
    }

    if (status === 'delivered') {
      fields.push("actual_delivery_date = CURRENT_TIMESTAMP");
    }

    values.push(numericId);
    const sql = `UPDATE trackings SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    return this.findById(numericId) as Promise<Tracking>;
  }

  async getActiveTrackings(): Promise<Tracking[]> {
    const [rows] = await db.query(
      `SELECT * FROM trackings WHERE is_active = 1 AND status != 'delivered' AND status != 'cancelled' ORDER BY created_at DESC`
    );
    return rows as Tracking[];
  }

  async getTrackingsByStatus(status: Tracking['status']): Promise<Tracking[]> {
    const [rows] = await db.query(`SELECT * FROM trackings WHERE status = ? ORDER BY created_at DESC`, [status]);
    return rows as Tracking[];
  }
}