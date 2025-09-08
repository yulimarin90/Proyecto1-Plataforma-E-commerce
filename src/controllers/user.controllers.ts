import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
  saveToken,
  deleteToken,
  findToken,
  replaceUser
} from "../models/user.model";
import { AuthRequest } from "../middlewares/auth.middlewares";
import db from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecreto";

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, telefono, direccion } = req.body;

    // Validar si ya existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await createUser({
      name,
      email,
      password: hashedPassword,
      telefono,
      direccion,
    });

    res.status(201).json({ message: "Usuario creado", userId });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

    // Verificar si está bloqueado, edpoint bloqueo
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({
        message: `Cuenta bloqueada. Intenta de nuevo después de ${user.locked_until}`,
      });
    }

    // Comparar contraseñas
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const failed = (user.failed_attempts || 0) + 1;
      let lockedUntil: Date | null = null;

      if (failed >= 3) {
        const bloqueado = new Date();
        bloqueado.setMinutes(bloqueado.getMinutes() + 15);
        lockedUntil = bloqueado;
      }

      await db.query(
        "UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?",
        [failed, lockedUntil, user.id]
      );

      return res.status(401).json({
        message:
          failed >= 3
            ? "Cuenta bloqueada por 15 minutos"
            : `Contraseña incorrecta. Intentos fallidos: ${failed}/3`,
      });
    }

    // Si contraseña es correcta → resetear intentos fallidos
    await db.query(
      "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
      [user.id]
    );

    // Generar tokens
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await saveToken(user.id!, refreshToken);

    res.json({ token, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error en el login", error });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token requerido" });

    await deleteToken(refreshToken);
    res.json({ message: "Sesión cerrada" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token requerido" });

    const tokenInDb = await findToken(refreshToken);
    if (!tokenInDb)
      return res.status(403).json({ message: "Token inválido o expirado" });

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;

    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ token: newToken });
  } catch (error) {
    res.status(403).json({ message: "Token inválido o expirado", error });
  }
};

// edpoint ver perfil
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Actualizar perfil (PATCH)
export const updateAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).id;
    await updateUser(userId, req.body);
    res.json({ message: "Perfil actualizado" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Eliminar cuenta
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).id;
    await deleteUser(userId);
    res.json({ message: "Cuenta eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Actualizar perfil completo (PUT)
export const replaceAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { name, email, telefono, direccion } = req.body;

    if (!name || !email || !telefono) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios (name, email, telefono)" });
    }

    await replaceUser(userId, { name, email, telefono, direccion });

    res.json({ message: "Perfil reemplazado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al reemplazar perfil", error });
  }
};