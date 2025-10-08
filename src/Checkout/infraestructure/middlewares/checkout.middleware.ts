// src/checkout/checkout.middleware.ts
import { Request, Response, NextFunction } from "express";

export const validateCheckout = (req: Request, res: Response, next: NextFunction) => {
  const { cartId, paymentMethod, shippingAddress } = req.body;
  if (!cartId || !paymentMethod || !shippingAddress) {
    return res.status(400).json({ error: "Campos obligatorios faltantes" });
  }
  next();
};

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  // Simula autenticación
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).json({ error: "No tienes permiso para acceder a este recurso" });
  }
  (req as any).user = { id: 1 }; // usuario simulado
  next();
};
