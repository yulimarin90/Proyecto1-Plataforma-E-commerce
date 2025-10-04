/* Adaptador de Express → aplicación.
   Recibe req y res, valida, y llama a los servicios.
   Su trabajo: traducir HTTP → casos de uso.
*/

import { Request, Response } from "express";
import { UserService } from "../../application/user.service";
import { MySQLUserRepository } from "../../infraestructure/repositories/user.repository.msql";
import { AuthService } from "../../Authentication/auth.service";

const userService = new UserService(new MySQLUserRepository());

/** Registro de usuario */
export const register = async (req: Request, res: Response) => {
  try {
    const { id, verificationToken } = await userService.register(req.body);
    res.status(201).json({ 
      message: "Usuario creado. Revisa tu correo para confirmar email.", 
      userId: id, 
      verificationToken 
    });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

/** Verificación de email */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    await userService.verifyEmail(token as string);
    res.status(200).json({ message: "Email verificado correctamente" });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

/** Login → genera access y refresh token */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Llamamos una sola vez al servicio
    const { id, accessToken, refreshToken } = await userService.login(email, password);

    // Guardamos refresh token en DB (si tu flujo lo requiere)
    await userService.saveRefreshToken(id, refreshToken);

    // Respondemos
    return res.status(200).json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error: any) {
    return res.status(error.status || 400).json({ message: error.message });
  }
};


/** Refresh → genera un nuevo access token */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: "Refresh token requerido" });
    }

    // Validamos refresh token en AuthService
    const payload = AuthService.verifyRefreshToken(refresh_token);

    // Validamos que siga activo en DB
    const valid = await userService.validateRefreshToken(payload.id, refresh_token);
    if (!valid) {
      return res.status(401).json({ message: "Refresh token no válido o expirado" });
    }

    // Generamos nuevo access token
    const newAccessToken = AuthService.generateAccessToken({ id: payload.id, email: payload.email });

    res.status(200).json({ access_token: newAccessToken });
  } catch (error: any) {
    return res.status(401).json({ message: "Refresh token inválido o expirado" });
  }
};

/** Perfil del usuario autenticado */
export const getProfile = async (req: Request, res: Response) => {
  try {
    res.json({ user: (req as any).user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/** Actualización parcial de cuenta */
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updatedUser = await userService.updateAccount(userId, req.body); 
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/** Reemplazo completo de cuenta */
export const replaceAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const replacedUser = await userService.replaceAccount(userId, req.body); 
    res.json(replacedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/** Eliminación de cuenta */
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await userService.deleteAccount(userId);
    res.status(200).json({ message: "Cuenta eliminada correctamente" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
