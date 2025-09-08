//lógica de cada endpoint

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as UserModel from "../models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta"; //definir cual va ser

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, telefono, direccion } = req.body;
    const existingUser = await UserModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await UserModel.createUser({ name, email, password: hashedPassword, telefono, direccion });

    res.status(201).json({ message: "Usuario creado", userId });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findUserByEmail(email);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // viene del middleware
    const user = await UserModel.findUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await UserModel.updateUser(userId, req.body);
    res.json({ message: "Perfil actualizado" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await UserModel.deleteUser(userId);
    res.json({ message: "Cuenta eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};
