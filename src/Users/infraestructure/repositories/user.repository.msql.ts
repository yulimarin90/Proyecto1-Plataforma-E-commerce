import db from "../../../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { User } from "../../domain/user.entity";
import { IUserRepository } from "../repositories/user.repository";

export class MySQLUserRepository implements IUserRepository {
  async create(user: User): Promise<number> {
  console.log("👉 Usuario que llega al repositorio:", user);

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO users 
      (name, email, password, phone, address, created_at, failed_attempts, locked_until, is_verified, verification_token, verification_expires)
     VALUES (?, ?, ?, ?, ?, NOW(), 0, NULL, 0, ?, ?)`,
    [
      user.name,
      user.email,
      user.password,
      user.phone,  // << aquí está cayendo NULL
      user.address,
      user.verification_token,
      user.verification_expires,
    ]
  );
  return result.insertId;
}


  
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(", ");
    const values = fields.map(f => (data as any)[f]);
    await db.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async delete(id: number): Promise<void> {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
  }

  async replace(id: number, data: User): Promise<void> {
    await db.query(
      "UPDATE users SET name=?, email=?, phone=?, address=? WHERE id=?",
      [data.name, data.email, data.phone, data.address || null, id]
    );
  }

  async saveToken(userId: number, token: string): Promise<void> {
    await db.query("INSERT INTO tokens (user_id, token) VALUES (?, ?)", [userId, token]);
  }

  async deleteToken(token: string): Promise<void> {
    await db.query("DELETE FROM tokens WHERE token = ?", [token]);
  }

  async findToken(token: string): Promise<any> {
    const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM tokens WHERE token = ?", [token]);
    return rows.length > 0 ? rows[0] : null;
  }

  async verifyUser(id: number): Promise<void> {
    await db.query("UPDATE users SET is_verified=1, verification_token=NULL, verification_expires=NULL WHERE id=?", [id]);
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE verification_token=?",
      [token]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }
}
