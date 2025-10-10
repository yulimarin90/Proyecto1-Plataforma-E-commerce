import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IUserRepository } from "../infraestructure/repositories/user.repository";
import { User } from "../domain/user.entity";
import { AuthService } from "../Authentication/auth.service";
import jwt from "jsonwebtoken";
export class UserService {
  constructor(private userRepository: IUserRepository) {}

 
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCK_TIME_MINUTES = 15;

  //Registro
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

  //Login de usuario 
  async login(email: string, password: string) {
  const user = await this.userRepository.findByEmail(email);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  // Si el usuario está bloqueado y el tiempo no ha pasado
 if (user.locked_until && new Date(user.locked_until) > new Date()) {
  throw { status: 403, message: "Cuenta bloqueada temporalmente. Intenta más tarde" };
}

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await this.userRepository.incrementFailedAttempts(user.id!);

    if (user.failed_attempts + 1 >= 3) {
  await this.userRepository.lockUser(user.id!);
  throw { status: 403, message: "Demasiados intentos fallidos. Cuenta bloqueada temporalmente." };
}

    throw { status: 401, message: "Contraseña incorrecta" };
  }

  // Si la contraseña es correcta
  await this.userRepository.resetFailedAttempts(user.id!);

  // Generar tokens
  const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = AuthService.generateRefreshToken({ id: user.id, email: user.email });

  return { id: user.id, accessToken, refreshToken };
}


  //Guardar refresh token
  async saveRefreshToken(userId: number, token: string) {
    await this.userRepository.saveToken(userId, token);
  }

  //Validar refresh token en la DB
  async validateRefreshToken(userId: number, token: string): Promise<boolean> {
    const stored = await this.userRepository.findToken(token);
    return !!stored;
  }

 
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

  //Eliminar cuenta
  async deleteAccount(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw { status: 404, message: "Usuario no encontrado" };

    await this.userRepository.delete(userId);
    return { message: "Usuario eliminado correctamente" };
  }

  //Verificación de email
  async verifyEmail(token: string) {
    if (!token) throw { status: 400, message: "Token de verificación faltante" };

    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) throw { status: 404, message: "Token inválido o usuario no encontrado" };

    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      throw { status: 400, message: "El token ha expirado" };
    }

    await this.userRepository.update(user.id!, {
      verification_token: null,
      verification_expires: null,
    });

    return { id: user.id, email: user.email };
  }

  //logout
  async logout(token: string) {
  const storedToken = await this.userRepository.findToken(token);
  if (!storedToken) {
    throw { status: 404, message: "Token no encontrado o ya expirado" };
  }

  await this.userRepository.deleteToken(token);
  return { message: "Sesión cerrada exitosamente" };
}
}
