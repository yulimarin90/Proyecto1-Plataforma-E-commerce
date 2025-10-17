
import { Router } from "express";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import { verifyUser } from "../infraestructure/middlewares/cart.middleware";
import { CartController } from "../infraestructure/controllers/cart.controller";

const router = Router();
const controller = new CartController();

// Rutas protegidas
router.use(authMiddleware, verifyUser);
router.get("/cart", (req, res) => controller.viewCart(req, res));
router.post("/cart/items", (req, res) => controller.addItem(req, res));
router.patch("/cart/items/:item_id", (req, res) =>
  controller.updateQuantity(req, res)
);
router.delete("/cart/items/:productId", (req, res) =>
  controller.removeItem(req, res)
);
router.delete("/cart/clear", (req, res) => controller.clearCart(req, res));

export default router; 