/* Adaptador de Express → aplicación.
Recibe req y res, valida, y llama a los servicios.
traducir HTTP → casos de uso.
*/

import { Request, Response } from "express";
import { UserService } from "../../application/user.service";
import { MySQLUserRepository } from "../../infraestructure/repositories/user.repository.msql";
import { AuthService } from "../../Authentication/auth.service";
import { JwtPayload } from "jsonwebtoken";


let userService = new UserService(new MySQLUserRepository());

//Registro de usuario
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

//Verificación de email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    await userService.verifyEmail(token as string);
    res.status(200).json({ message: "Email verificado correctamente" });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

// Login 
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { id, accessToken, refreshToken } = await userService.login(email, password);

    await userService.saveRefreshToken(id, refreshToken);

    return res.status(200).json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error: any) {
    return res.status(error.status || 400).json({ message: error.message });
  }
};


//Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: "Refresh token requerido" });
    }

    const payload = AuthService.verifyRefreshToken(refresh_token) as JwtPayload;

    const valid = await userService.validateRefreshToken(payload.id, refresh_token);
    if (!valid) {
      return res.status(401).json({ message: "Refresh token no válido o expirado" });
    }

    // nuevo access token
    const newAccessToken = AuthService.generateAccessToken({ id: payload.id, email: payload.email });

    res.status(200).json({ access_token: newAccessToken });
  } catch (error: any) {
    return res.status(401).json({ message: "Refresh token inválido o expirado" });
  }
};

//ver perfil
export const getProfile = async (req: Request, res: Response) => {
  try {
    res.json({ user: (req as any).user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//actualizacion parcial de algunos campos patch
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updatedUser = await userService.updateAccount(userId, req.body); 
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//actualizacion completa de la cuenta put
export const replaceAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const replacedUser = await userService.replaceAccount(userId, req.body); 
    res.json(replacedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//delete eliminar cuenta
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await userService.deleteAccount(userId);
    res.status(200).json({ message: "Cuenta eliminada correctamente" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Intentamos tomar token del header Authorization
    let token = req.headers.authorization?.split(" ")[1];

    // Si no hay token en header, revisamos el body
    if (!token) token = req.body.token;

    if (!token) return res.status(400).json({ message: "Token faltante" });

    await userService.logout(token);

    res.status(200).json({ message: "Sesión cerrada exitosamente" });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al cerrar sesión" });
  }
};

