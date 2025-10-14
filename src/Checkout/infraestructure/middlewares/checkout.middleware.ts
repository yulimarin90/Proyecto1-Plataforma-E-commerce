// src/checkout/checkout.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "secret";

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token requerido" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token inválido" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded; // adjuntamos info del usuario
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}

export const validateCheckout = (req: Request, res: Response, next: NextFunction) => {
  const { products, payment_method, shipping_address } = req.body;

  if (!products || products.length === 0 || !payment_method || !shipping_address) {
    return res.status(400).json({
      message: "Faltan datos de envío, pago o el carrito está vacío",
    });
  }

  next();
};
