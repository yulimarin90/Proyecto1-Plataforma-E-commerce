// products/infraestructure/middlewares/products.middleware.ts
import { Request, Response, NextFunction } from "express";

export const productMiddleware = {
  validateCreate: (req: Request, res: Response, next: NextFunction) => {
    const { nombre, precio, stock, cantidad, categoria_id } = req.body;
    if (!nombre) return res.status(400).json({ message: "nombre requerido" });
    if (!precio || isNaN(Number(precio))) return res.status(400).json({ message: "precio inválido" });
    if (!stock || isNaN(Number(stock))) return res.status(400).json({ message: "stock inválido" });
    if (!cantidad || isNaN(Number(cantidad))) return res.status(400).json({ message: "cantidad inválida" });
    if (!categoria_id) return res.status(400).json({ message: "categoria_id requerido" });
    next();
  },

  validateUpdate: (req: Request, res: Response, next: NextFunction) => {
    // similar pero menos estricto
    next();
  },

  checkProductExists: (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id && !req.params.product_id) {
      return res.status(400).json({ message: "id requerido" });
    }
    next();
  },

  checkNoOrdersAssociated: (req: Request, res: Response, next: NextFunction) => {
    // simulación → en realidad deberías consultar tu tabla de órdenes
    next();
  },
};
