// src/Cart/routes/cart.routes.ts
import express from "express";
import { CartController } from "../infraestructure/controllers/cart.controller";
import { 
  authMiddleware, 
  checkCartExpiration, 
  validateItemData 
} from "../infraestructure/middlewares/cart.middleware";

const router = express.Router();
const cartController = new CartController();

// 📦 Rutas del carrito
router.get(
  "/cart",
  authMiddleware,
  checkCartExpiration,
  cartController.viewCart
);

router.post(
  "/admin/cart/items",
  authMiddleware,
  checkCartExpiration,
  validateItemData,
  cartController.addItem
);

router.put(
  "/admin/cart/items/:item_id",
  authMiddleware,
  checkCartExpiration,
  validateItemData,
  cartController.updateQuantity
);

router.delete(
  "/admin/cart/items",
  authMiddleware,
  checkCartExpiration,
  cartController.removeItem
);

router.delete(
  "/admin/cart/items/:item_id",
  authMiddleware,
  cartController.clearCart
);

export default router;
