/*Adaptador de Express → aplicación.

Recibe req y res, valida, y llama a los servicios.

Su trabajo: traducir HTTP → casos de uso

nos traemos por inyeccion de dependencias lo que esta en aplication y poder ejecutar
el caso de uso*/

import { Request, Response } from "express";
import { UserService } from "../../application/user.service";
import { MySQLUserRepository } from "../../infraestructure/repositories/user.repository.msql";

const userService = new UserService(new MySQLUserRepository());

export const register = async (req: Request, res: Response) => {
  try {
    const result = await userService.register(req.body);
    res.status(201).json({ message: "Usuario creado. Revisa tu correo.", ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Rutas protegidas (AUTH)
// ============================

export const getProfile = async (req: Request, res: Response) => {
  try {
    // El usuario ya viene en req.user desde el middleware
    res.json({ user: (req as any).user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updatedUser = await UserService.updateAccount(userId, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const replaceAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const replacedUser = await UserService.replaceAccount(userId, req.body);
    res.json(replacedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await UserService.deleteAccount(userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};