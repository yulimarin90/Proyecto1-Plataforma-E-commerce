/*
Adaptador de BD → aplicación.

Implementa la interfaz definida en domain (IUserRepository).

Traduce llamadas de alto nivel (createUser) en queries reales (SQL, Sequelize, etc.).
*/
import { NewUser, User } from "../../domain/user.entity";

// Puerto del repositorio (contrato)
export interface IUserRepository {
  create(user: NewUser): Promise<number>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  update(id: number, data: Partial<User>): Promise<void>;
  delete(id: number): Promise<void>;
  replace(id: number, data: Omit<User, "id">): Promise<void>;
  saveToken(userId: number, token: string): Promise<void>;
  deleteToken(token: string): Promise<void>;
  findToken(token: string): Promise<any>;
  verifyUser(id: number): Promise<void>;
  findByVerificationToken(token: string): Promise<User | null>;
  incrementFailedAttempts(userId: number): Promise<void>;
  lockUser(userId: number): Promise<void>;
  resetFailedAttempts(userId: number): Promise<void>;
}
