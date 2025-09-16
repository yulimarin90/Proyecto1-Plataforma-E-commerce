// consultas SQL que interactúan con la base de datos
import db from "../config/db"; // Conexión MySQL
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  telefono: number;
  direccion?: string;
  created_at?: Date;
  failed_attempts?: number;
  locked_until?: Date | null;
  is_verified?: boolean;
  verification_token?: string | null; //token de verificacion correo
  verification_expires?: Date | null; //token de verificacion correo
}

// Crear usuario con token de verificación
export const createUser = async (user: User): Promise<number> => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO users (name, email, password, telefono, direccion, created_at, failed_attempts,   
       locked_until, is_verified, verification_token, verification_expires) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      user.name,
      user.email,
      user.password,
      user.telefono,
      user.direccion,
      user.created_at,
      user.failed_attempts,
      user.locked_until,
      user.verification_token,
      user.verification_expires,
    ]
  );
  return result.insertId;
};

export const findUserByEmail1 = async (email: string): Promise<User | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

export const findUserByVerificationToken = async (token: string): Promise<User | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE verification_token = ?",
    [token]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

export const verifyUser = async (id: number) => {
  await db.query(
    "UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?",
    [id]
  );
};

// Buscar usuario por email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

// Buscar usuario por id
export const findUserById = async (id: number): Promise<User | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

// Actualizar usuario (PATCH dinámico)
export const updateUser = async (id: number, data: Partial<User>) => {
  const allowedFields = ["name", "email", "telefono", "direccion", "password"];
  const fields = Object.keys(data).filter((f) => allowedFields.includes(f));
  if (fields.length === 0) return;

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => (data as any)[f]);

  const query = `UPDATE users SET ${setClause} WHERE id = ?`;
  await db.query(query, [...values, id]);
};

// Eliminar usuario
export const deleteUser = async (id: number) => {
  await db.query("DELETE FROM users WHERE id = ?", [id]);
};

// Guardar token de refresh
export const saveToken = async (userId: number, token: string) => {
  await db.query("INSERT INTO tokens (user_id, token) VALUES (?, ?)", [
    userId,
    token,
  ]);
};

// Eliminar token
export const deleteToken = async (token: string) => {
  await db.query("DELETE FROM tokens WHERE token = ?", [token]);
};

// Buscar token
export const findToken = async (token: string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM tokens WHERE token = ?",
    [token]
  );
  return rows.length > 0 ? rows[0] : null;
};

// put perfil
export const replaceUser = async (
  id: number,
  data: { name: string; email: string; telefono: number; direccion?: string }
) => {
  await db.query(
    "UPDATE users SET name = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?",
    [data.name, data.email, data.telefono, data.direccion || null, id]
  );
};
