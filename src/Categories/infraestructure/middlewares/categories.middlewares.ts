
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CategoriesService } from "../../application/categories.service";
import { CategoriesRepository } from "../repositories/categories.repository";

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

const categoriesService = new CategoriesService(new CategoriesRepository());

// Validar campos al crear
export const validateCreateCategory = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Nombre requerido" });
  next();
};

// Validar campos al actualizar
export const validateUpdateCategory = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  if (name !== undefined && name.trim() === "") {
    return res.status(400).json({ message: "Nombre inválido" });
  }
  next();
};

// Middleware para verificar que exista la categoría
export const categoryExistsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id || req.params.category_id);
  if (!id) return res.status(400).json({ message: "ID de categoría requerido" });

  try {
    const category = await categoriesService.getCategoryById(id).catch(() => null);
    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

    (req as any).category = category; // adjuntamos info al request
    next();
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error verificando categoría" });
  }
};