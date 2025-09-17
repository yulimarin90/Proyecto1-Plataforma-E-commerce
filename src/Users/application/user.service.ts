//Casos de uso. No sabe nada de Express ni MySQL.
//los casos deben se transaccionales, todo o nada, o llamado atomico 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { IUserRepository } from "../infraestructure/repositories/user.repository";
import { User } from "../domain/user.entity";

const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecreto";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  //metodo
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

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Usuario no encontrado");

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error(`Cuenta bloqueada hasta ${user.locked_until}`);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const failed = (user.failed_attempts || 0) + 1;
      let lockedUntil: Date | null = null;
      if (failed >= 3) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userRepository.update(user.id!, {
        failed_attempts: failed,
        locked_until: lockedUntil,
      });
      throw new Error(failed >= 3 ? "Cuenta bloqueada" : `Contraseña incorrecta. Intentos: ${failed}/3`);
    }

    // Reset fallos
    await this.userRepository.update(user.id!, {
      failed_attempts: 0,
      locked_until: null,
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: "7d" });

    await this.userRepository.saveToken(user.id!, refreshToken);

    return { token, refreshToken };
  }
}

export const updateAccount = async (userId: string, data: any) => {
  // lógica para actualizar parcialmente
};

export const replaceAccount = async (userId: string, data: any) => {
  // lógica para reemplazar el usuario entero
};

export const deleteAccount = async (userId: string) => {
  // lógica para eliminar usuario
};
