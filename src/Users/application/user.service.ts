import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { IUserRepository } from "../infraestructure/repositories/user.repository";
import { User } from "../domain/user.entity";

const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecreto";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  // Constantes de la clase
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCK_TIME_MINUTES = 15;

  // Registro
  async register(data: Omit<User, "id">) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) throw new Error("El correo ya está registrado");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const id = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      verification_token: verificationToken,
      verification_expires: verificationExpires,
    });

    return { id, verificationToken };
  }

  // Login
  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    // Verificar bloqueo
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw { status: 429, message: `Cuenta bloqueada hasta ${user.locked_until}` };
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const failed = (user.failed_attempts || 0) + 1;
      let lockedUntil: Date | null = null;

      if (failed >= this.MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + this.LOCK_TIME_MINUTES * 60 * 1000);
      }

      await this.userRepository.update(user.id!, {
        failed_attempts: failed,
        locked_until: lockedUntil,
      });

      if (failed >= this.MAX_FAILED_ATTEMPTS) {
        throw { status: 429, message: "Cuenta bloqueada por demasiados intentos fallidos" };
      } else {
        throw { status: 401, message: `Contraseña incorrecta. Intentos: ${failed}/${this.MAX_FAILED_ATTEMPTS}` };
      }
    }

    // Resetear intentos fallidos al loguearse
    await this.userRepository.update(user.id!, {
      failed_attempts: 0,
      locked_until: null,
    });

    // Generar tokens
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: "7d" });

    await this.userRepository.saveToken(user.id!, refreshToken);

    return { token, refreshToken };
  }
  // revisar de aca hacia abajo 
   async updateAccount(userId: number, data: Partial<User>) {
  const user = await this.userRepository.findById(userId);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  await this.userRepository.update(userId, data);
  return { message: "Usuario actualizado parcialmente" };
}

async replaceAccount(userId: number, data: Omit<User, "id">) {
  const user = await this.userRepository.findById(userId);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  await this.userRepository.replace(userId, data);
  return { message: "Usuario reemplazado completamente" };
}

async deleteAccount(userId: number) {
  const user = await this.userRepository.findById(userId);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  await this.userRepository.delete(userId);
  return { message: "Usuario eliminado correctamente" };
}
}