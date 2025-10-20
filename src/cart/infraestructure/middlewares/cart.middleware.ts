
// Lógica que se ejecuta antes de los controladores relacionados con el carrito
import { CartService } from "../../application/cart.service";
import { CartRepository } from "../repositories/cart.repository.msql";
import { ProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const productsRepository = new ProductsRepository();
const cartRepository = new CartRepository(productsRepository);
const cartService = new CartService(cartRepository);


// Extensión de Request con información del carrito
export interface CartRequest extends Request {
  user?: any;
  cart?: any;
  product?: any;
}

// Middleware para verificar que el usuario esté autenticado
export const authCartMiddleware = (req: CartRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers["x-user-id"];

  if (!authHeader && !userIdHeader) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      if (!token) return res.status(401).json({ message: "Token requerido" });
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      return res.status(403).json({ message: "Token inválido o expirado" });
    }
  }

  if (userIdHeader) {
    req.user = { id: Number(userIdHeader) };
    return next();
  }
};




// Middleware para verificar que el carrito exista
export const ensureCartExists = async (req: CartRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user?.id || req.headers["x-user-id"]);
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const cart = await cartService.getCart(userId);
    if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });


    // Verificar si el carrito ha expirado (más de 24h sin actividad)
    const now = new Date();
    if (cart.expires_at && new Date(cart.expires_at) < now) {
      return res.status(410).json({ message: "El carrito ha expirado por inactividad" });
    }

    req.cart = cart;
    next();
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error verificando el carrito" });
  }
};

// Middleware para verificar stock antes de agregar o actualizar ítems
export const checkProductStock = async (req: CartRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: "productId y cantidad son requeridos" });
    }

    const product = await productsRepository.findById(Number(productId));
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    if (quantity > product.stock) {
      return res.status(400).json({ message: "Cantidad supera el stock disponible" });
    }

    // Adjuntar información del producto para el siguiente paso (controlador)
    req.product = product;
    next();
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error verificando el stock del producto" });
  }
};

// Middleware para validar estructura del body al agregar o actualizar ítems
export const validateCartItem = (req: Request, res: Response, next: NextFunction) => {
  const { productId, quantity } = req.body;
  if (!productId || typeof productId !== "number") {
    return res.status(400).json({ message: "productId debe ser un número válido" });
  }
  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ message: "cantidad debe ser un número positivo" });
  }
  next();
};

export const validateCartBeforeCheckout = (req: CartRequest, res: Response, next: NextFunction) => {
  if (!req.cart || req.cart.items.length === 0) {
    return res.status(400).json({ message: "El carrito está vacío" });
  }
  next();
};

export const verifyPriceLock = async (req: CartRequest, res: Response, next: NextFunction) => {
  const cart = req.cart;
  const now = new Date();

  for (const item of cart.items) {
    if (item.price_locked_until && now > new Date(item.price_locked_until)) {
      // Buscar precio actual
      const product = await productsRepository.findById(item.product_id);
      if (product) {
        item.price = product.price;
        item.subtotal = item.price * item.quantity;
        item.price_locked_until = new Date(Date.now() + 2 * 60 * 60 * 1000);
      }
    }
  }

  await cartService.saveCart(cart);
  next();
};
