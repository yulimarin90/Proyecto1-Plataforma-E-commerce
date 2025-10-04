//Lógica que se ejecuta antes de entrar a un controlador.
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../Authentication/auth.service"; // usa el AuthService centralizado

// Extensión de Request para incluir `user`
export interface AuthRequest extends Request {
  user?: any;
}

// 🔐 Middleware principal para proteger rutas
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1️⃣ Encabezado Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2️⃣ Body
  if (!token && req.body?.token) {
    token = req.body.token;
  }

  // 3️⃣ Query string
  if (!token && req.query?.token) {
    token = String(req.query.token);
  }

  // 4️⃣ Si no hay token
  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = AuthService.verifyAccessToken(token); // 👈 usamos AuthService
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(error.status || 403).json({ message: error.message });
  }
};

// ⬇️ export default para el middleware principal
export default authMiddleware;

/* ------------------- VALIDADORES ESPECÍFICOS ------------------- */

// 🟢 Validación de Registro
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Faltan campos obligatorios (name, email, password)" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Formato inválido de email" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Contraseña insegura: mínimo 8 caracteres, con mayúsculas, minúsculas y números",
    });
  }

  next();
};

// 🟢 Validación de Login
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Faltan campos obligatorios (email, password)" });
  }
  next();
};

// 🟢 Validación de Refresh Token
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(401).json({ message: "Refresh token faltante" });
  }

  try {
    AuthService.verifyRefreshToken(refresh_token); // 👈 usamos AuthService
    next();
  } catch (error: any) {
    return res.status(error.status || 401).json({ message: error.message });
  }
};

// 🟢 Validación de Logout
export const validateLogout = (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token faltante" });
  }
  next();
};

// 🟢 Validación de Editar Perfil
export const validateEditProfile = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  if (password && password.length < 8) {
    return res.status(400).json({
      message: "Contraseña inválida, debe tener mínimo 8 caracteres",
    });
  }
  next();
};
