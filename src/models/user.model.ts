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
}

// Crear usuario
export const createUser = async (user: User): Promise<number> => {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password, telefono, direccion) VALUES (?, ?, ?, ?, ?)",
    [user.name, user.email, user.password, user.telefono, user.direccion]
  );
  return result.insertId;
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
