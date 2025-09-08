//consultas SQL que interactúan con la base de datos
import db from "../config/db"; // Conexión MySQL
import { ResultSetHeader, RowDataPacket } from "mysql2"; //conectarte a MySQL.

export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  telefono: number;
  direccion?: string;
}

export const createUser = async (user: User): Promise<number> => {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password, telefono, direccion) VALUES (?, ?, ?)",
    [user.name, user.email, user.password, user.telefono, user.direccion]
  );
  return result.insertId;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

export const updateUser = async (id: number, data: Partial<User>) => {
  await db.query("UPDATE users SET ? WHERE id = ?", [data, id]);
};

export const deleteUser = async (id: number) => {
  await db.query("DELETE FROM users WHERE id = ?", [id]);
};
