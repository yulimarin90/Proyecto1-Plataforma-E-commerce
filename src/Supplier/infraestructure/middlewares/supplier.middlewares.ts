import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { SuppliersService } from "../../application/supplier.service";
import { SuppliersRepository } from "../repositories/supplier.repository";

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

const suppliersService = new SuppliersService(new SuppliersRepository());

// Extensión del Request para adjuntar supplier
export interface SupplierRequest extends Request {
  supplier?: any;
}

// Validación al crear proveedor
export const validateCreateSupplier = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone } = req.body;

  if (!name || String(name).trim() === "") {
    return res.status(400).json({ message: "Nombre requerido" });
  }

  if (email !== undefined && email !== null && String(email).trim() !== "") {
    // validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({ message: "Email inválido" });
    }
  }

  if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
    // validación simple de teléfono (solo dígitos, opcional +, -, espacios)
    const phoneClean = String(phone).replace(/[\s\-+()]/g, "");
    if (!/^\d{6,20}$/.test(phoneClean)) {
      return res.status(400).json({ message: "Teléfono inválido" });
    }
  }

  next();
};

// Validación al actualizar proveedor (campos opcionales)
export const validateUpdateSupplier = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, is_active } = req.body;

  if (name !== undefined && String(name).trim() === "") {
    return res.status(400).json({ message: "Nombre inválido" });
  }

  if (email !== undefined && email !== null && String(email).trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({ message: "Email inválido" });
    }
  }

  if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
    const phoneClean = String(phone).replace(/[\s\-+()]/g, "");
    if (!/^\d{6,20}$/.test(phoneClean)) {
      return res.status(400).json({ message: "Teléfono inválido" });
    }
  }

  if (is_active !== undefined && isNaN(Number(is_active))) {
    return res.status(400).json({ message: "is_active inválido (debe ser 0 o 1)" });
  }

  next();
};

// Middleware para verificar existencia del proveedor por id
export const supplierExistsMiddleware = async (req: SupplierRequest, res: Response, next: NextFunction) => {
  const id = Number(req.params.id || req.params.supplier_id);
  if (!id || isNaN(id)) return res.status(400).json({ message: "ID de proveedor requerido" });

  try {
    const supplier = await suppliersService.getSupplierById(id).catch(() => null);
    if (!supplier) return res.status(404).json({ message: "Proveedor no encontrado" });

    req.supplier = supplier;
    next();
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error verificando proveedor" });
  }
};