// 📦 Rutas del módulo Cart
// Define los endpoints REST para gestionar el carrito de compras.
// Usa controladores y middlewares para validar autenticación y datos.

import { Router } from "express";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import { verifyUser } from "../infraestructure/middlewares/cart.middleware";
import { CartController } from "../infraestructure/controllers/cart.controller";

const router = Router();
const controller = new CartController();

// 🔒Rutas protegidas
// Todas las rutas del carrito requieren autenticación del usuario
// ya que están asociadas a un user_id.
router.use(authMiddleware, verifyUser);

// Obtener carrito del usuario
router.get("/cart", (req, res) => controller.viewCart(req, res));

// Agregar producto al carrito
router.post("/cart/items", (req, res) => controller.addItem(req, res));

// Actualizar cantidad de un producto
router.patch("/cart/items/:item_id", (req, res) =>
  controller.updateQuantity(req, res)
);

// Eliminar producto específico
router.delete("/cart/items/:productId", (req, res) =>
  controller.removeItem(req, res)
);

// Vaciar carrito completo
router.delete("/cart/clear", (req, res) => controller.clearCart(req, res));

export default router;