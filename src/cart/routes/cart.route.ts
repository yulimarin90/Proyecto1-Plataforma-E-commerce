import express from "express";
import { CartController } from "../infraestructure/controllers/cart.controller";
import { verifyUser } from "../infraestructure/middlewares/cart.middleware";

const router = express.Router();
const controller = new CartController();

router.get("/", verifyUser, controller.viewCart);
router.post("/items", verifyUser, controller.addItem);
router.patch("/items", verifyUser, controller.updateQuantity);
router.delete("/items", verifyUser, controller.removeItem);
router.delete("/", verifyUser, controller.clearCart);

export default router;
