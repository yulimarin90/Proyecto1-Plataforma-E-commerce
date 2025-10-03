
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
    const body = {
      ...req.body,
      phone: req.body.phone||req.body.telefono,   // ✅ mapeo temporal
    };
    delete (body as any).telefono;

    const result = await userService.register(body);
    res.status(201).json({ message: "Usuario creado. Revisa tu correo.", ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
};


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
    const updatedUser = await userService.updateAccount(userId, req.body); // ✅ corregido
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error en updateAccount:", error);
    res.status(500).json({ message: error.message });
  }
};

export const replaceAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const replacedUser = await userService.replaceAccount(userId, req.body); // ✅ corregido
    res.json(replacedUser);
  } catch (error: any) {
    console.error("Error en replaceAccount:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await userService.deleteAccount(userId);

    // 200 OK con mensaje
    res.status(200).json({ message: "Cuenta eliminada correctamente" });
  } catch (error: any) {
    console.error("Error en deleteAccount:", error);
    res.status(500).json({ message: error.message });
  }
};