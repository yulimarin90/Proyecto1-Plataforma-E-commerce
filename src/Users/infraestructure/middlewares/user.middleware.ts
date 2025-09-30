//Lógica que se ejecuta antes de entrar a un controlador.
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";

// Extensión de Request para incluir `user`
export interface AuthRequest extends Request {
  user?: any;
}

// Ruta que quiera una autenticacion: obtener perfil, editar perfil, ver usuarios.
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // se guarda el usuario en la request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};

export default authMiddleware;


export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  //Campos obligatorios
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Faltan campos obligatorios (name, email, password)" });
  }

  //Formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Formato inválido de email" });
  }

  //Longitud mínima de contraseña
  if (password.length < 6) {
    return res.status(400).json({ message: "Contraseña insegura, la contraseña debe tener mínimo 8 caracteres con mayúsculas, minúsculas y números" });
  }

  next(); //pasa al controller si todo funciona
};

//Validación de Login
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Faltan campos obligatorios (email, password)" }); // 400
  }

  
  next();
};


//Validación de Refresh Token
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Token faltante o no enviado" }); // 401
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" }); // 401
  }
};


//Validación de Logout
export const validateLogout = (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token faltante" }); // 400
  }

  next();
};


//Validación de Editar Perfil
export const validateEditProfile = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (password && password.length < 8) {
    return res.status(400).json({
      message: "Contraseña inválida, debe tener mínimo 8 caracteres",
    }); // 400
  }

  next();
};