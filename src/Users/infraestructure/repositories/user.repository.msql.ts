import db from "../../../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { User, NewUser } from "../../domain/user.entity";
import { IUserRepository } from "../repositories/user.repository";

export class MySQLUserRepository implements IUserRepository {
  async create(user: NewUser): Promise<number> {
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

  if (rows.length === 0) {
    return null;
  }

  const userRow = rows[0]!; // ← el "!" le dice a TS: "ya comprobé que no es undefined"

  const user: User = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    password: userRow.password,
    address: userRow.address,
    phone: userRow.phone,
    created_at: userRow.created_at,
    failed_attempts: userRow.failed_attempts ?? 0,
    locked_until: userRow.locked_until,
    is_verified: Boolean(userRow.is_verified),
    verification_token: userRow.verification_token,
    verification_expires: userRow.verification_expires,
  };

  return user;
}

async findById(id: number): Promise<User | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const userRow = rows[0]!;

  const user: User = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    password: userRow.password,
    address: userRow.address,
    phone: userRow.phone,
    created_at: userRow.created_at,
    failed_attempts: userRow.failed_attempts ?? 0,
    locked_until: userRow.locked_until,
    is_verified: Boolean(userRow.is_verified),
    verification_token: userRow.verification_token,
    verification_expires: userRow.verification_expires,
  };

  return user;
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

 async replace(id: number, data: Omit<User, "id">): Promise<void> {
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


  async incrementFailedAttempts(userId: number): Promise<void> {
    await db.query("UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?", [userId]);
  }

  async lockUser(userId: number): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + 10); // 10 minutos bloqueado
    await db.query("UPDATE users SET locked_until = ?, failed_attempts = 0 WHERE id = ?", [
      lockUntil,
      userId,
    ]);
  }

  async resetFailedAttempts(userId: number): Promise<void> {
    await db.query("UPDATE users SET failed_attempts = 0 WHERE id = ?", [userId]);
  }
}



