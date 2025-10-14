
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../../../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
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

interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function verifyUserMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ code: 401, message: "Usuario no autenticado" });
  }

  const [rows]: any = await db.query(`SELECT is_verified FROM users WHERE id = ?`, [user.id]);
  if (!rows || rows.length === 0) {
    return res.status(404).json({ code: 404, message: "Usuario no encontrado" });
  }

  if (!rows[0].is_verified) {
    return res.status(403).json({ code: 403, message: "Usuario no verificado" });
  }

  next();
}

export async function validateStockMiddleware(req: Request, res: Response, next: NextFunction) {
  const { products } = req.body;
  if (!products || products.length === 0) {
    return res.status(400).json({ code: 400, message: "No hay productos en la orden" });
  }

  for (const p of products) {
    const [rows]: any = await db.query(
      `SELECT stock FROM products WHERE id = ? AND is_active = 1`,
      [p.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ code: 404, message: `Producto con id ${p.id} no encontrado` });
    }
    if (rows[0].stock < p.quantity) {
      return res.status(403).json({
        code: 403,
        message: `Producto con id ${p.id} sin stock suficiente`
      });
    }
  }

  next();
}

export function validateOrderFields(req: Request, res: Response, next: NextFunction) {
  const { shipping_address, payment_method } = req.body;

  if (!shipping_address || shipping_address.trim() === "") {
    return res.status(400).json({
      code: 400,
      message: "Dirección de envío incompleta"
    });
  }

  if (!payment_method || payment_method.trim() === "") {
    return res.status(400).json({
      code: 400,
      message: "Método de pago inválido"
    });
  }

  next();
}