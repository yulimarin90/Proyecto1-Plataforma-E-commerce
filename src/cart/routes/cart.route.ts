import { Router } from "express";
//import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import { verifyUser } from "../infraestructure/middlewares/cart.middleware";
import { CartController } from "../infraestructure/controllers/cart.controller";

const router = Router();
const controller = new CartController();

// Todas las rutas del carrito requieren autenticación
//router.use(authMiddleware, verifyUser);

// Ver carrito
router.get("/cart", controller.viewCart);

// Agregar producto
router.post("/cart/items", controller.addItem);

// Actualizar cantidad
router.patch("/cart/items/:productId", controller.updateQuantity);

// Eliminar producto
router.delete("/cart/items/:productId", controller.removeItem);

// Vaciar carrito
router.delete("/cart/clear", controller.clearCart);

export default router;