//ponemos la Lógica que se ejecuta antes de entrar a un controlador.
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../Authentication/auth.service"; 
import { MySQLUserRepository } from "../../infraestructure/repositories/user.repository.msql";
const userRepo = new MySQLUserRepository();


export interface AuthRequest extends Request {
  user?: any;
}

// Middleware principal
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.body?.token) {
    token = req.body.token;
  }

  if (!token && req.query?.token) {
    token = String(req.query.token);
  }

  // si no hay token
  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = AuthService.verifyAccessToken(token); 
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(error.status || 403).json({ message: error.message });
  }
};

export default authMiddleware;

//validadores especificos con reglas de negocio


// Validación de Registro
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Faltan campos obligatorios (name, email, password)" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Formato inválido de email" });
  }

  //contraseña segura
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!strongPassword.test(password)) {
    return res.status(400).json({
      message:
        "La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas y números.",
    });
  }

  next();
};

//Validación de Login
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Faltan campos obligatorios (email, password)" });
  }
  next();
};

// Validación de Refresh Token
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(401).json({ message: "Refresh token faltante" });
  }

  try {
    AuthService.verifyRefreshToken(refresh_token); 
    next();
  } catch (error: any) {
    return res.status(error.status || 401).json({ message: error.message });
  }
};

// Validación de Logout
export const validateLogout = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(400).json({ message: "Token faltante" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(400).json({ message: "Token faltante" });

  // Puedes guardarlo en req.body para el controller si quieres
  (req as any).token = token;
  next();
};

// Validación de Editar Perfil
export const validateEditProfile = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  if (password && password.length < 8) {
    return res.status(400).json({
      message: "Contraseña inválida, debe tener mínimo 8 caracteres",
    });
  }
  next();
};

export const requireVerifiedEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El email es obligatorio" });
    }

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Debes verificar tu correo electrónico antes de iniciar sesión",
      });
    }

    next();
  } catch (error) {
    console.error("Error en requireVerifiedEmail:", error);
    return res.status(500).json({ message: "Error verificando el email del usuario" });
  }
};