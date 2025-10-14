import { Request, Response, NextFunction } from "express";
import { ProductsService } from "../../application/products.service";
import { ProductsRepository } from "../repositories/products.repository";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const productsService = new ProductsService(new ProductsRepository());

//middleware principal de token 
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

// Extensión de Request
export interface ProductRequest extends Request {
  product?: any;
}

// Middleware principal para validar que el producto exista
export const productExistsMiddleware = async (req: ProductRequest, res: Response, next: NextFunction) => {
  const id = Number(req.params.id || req.params.product_id);
  if (!id) return res.status(400).json({ message: "ID del producto requerido" });

  try {
    const product = await productsService.getProductById(id).catch(() => null);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    req.product = product; // adjuntamos el producto al request
    next();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error verificando el producto" });
  }
};

// Validación de creación de producto
export const validateCreateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { name, price, stock, category_id } = req.body;

  if (!name) return res.status(400).json({ message: "Nombre requerido" });
  if (!price || isNaN(Number(price))) return res.status(400).json({ message: "Precio inválido" });
  if (!stock || isNaN(Number(stock))) return res.status(400).json({ message: "Stock inválido" });
  if (!category_id) return res.status(400).json({ message: "category_id requerido" });

  next();
};

// Validación de actualización de producto
export const validateUpdateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { price, stock } = req.body;
  if (price !== undefined && isNaN(Number(price))) {
    return res.status(400).json({ message: "Precio inválido" });
  }
  if (stock !== undefined && isNaN(Number(stock))) {
    return res.status(400).json({ message: "Stock inválido" });
  }
  next();
};


export const checkNoOrdersAssociated = async (req: ProductRequest, res: Response, next: NextFunction) => {
  //revisar si el producto tiene órdenes
  
  next();
};
