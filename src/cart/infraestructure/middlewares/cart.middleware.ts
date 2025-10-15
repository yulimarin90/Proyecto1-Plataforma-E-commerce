// src/Cart/infraestructure/middlewares/cart.middleware.ts
import { Request, Response, NextFunction } from "express";
import { CartRepositoryMySQL } from "../repositories/cart.repository.msql";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const cartRepository = new CartRepositoryMySQL();

// 🛡️ Middleware de autenticación con token JWT
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token requerido" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token inválido" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}


// 🕒 Verificar expiración de carrito
export async function checkCartExpiration(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.headers["x-user-id"]);
    const cart = await cartRepository.findByUser(userId.toString());

    if (cart?.expires_at) {
  const expiresAt = new Date(cart.expires_at);
  const now = new Date();

  if (expiresAt < now) {
    return res.status(400).json({ error: "El carrito ha expirado. Debes crear uno nuevo." });
  }
}

    next();
  } catch (error: any) {
    return res.status(400).json({ error: "Error al verificar el carrito." });
  }
}

// 🛑 Validar datos de producto
export function validateItemData(req: Request, res: Response, next: NextFunction) {
  const { productId, cantidad, quantity } = req.body;
  const qty = cantidad ?? quantity;

  if (!productId || typeof qty !== "number" || qty <= 0) {
    return res.status(400).json({ error: "Datos de producto inválidos" });
  }

  next();
}
