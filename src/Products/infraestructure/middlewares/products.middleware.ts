// middlewares/product.middleware.ts
import { Request, Response, NextFunction } from "express";
import { Product } from "../models/product.model"; // <- ajusta si tu fichero se llama product.models


// Valida el body para crear/actualizar producto
export const validateProductBody = (req: Request, res: Response, next: NextFunction) => {
  const { nombre, precio, stock, categoria_id } = req.body;
  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ message: "nombre es requerido y debe ser string" });
  }
  if (precio == null || typeof precio !== "number") {
    return res.status(400).json({ message: "precio es requerido y debe ser number" });
  }
  if (stock == null || typeof stock !== "number") {
    return res.status(400).json({ message: "stock es requerido y debe ser number" });
  }
  if (!categoria_id) {
    return res.status(400).json({ message: "categoria_id es requerido" });
  }
  next();
};

// Comprueba que exista el producto (usa en rutas que reciban :id)
export const checkProductExists = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Parametro id requerido" });

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    (req as any).product = product; // lo dejamos accesible para el controller si se necesita
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor", error });
  }
};
