// src/checkout/checkout.route.ts
import express from "express";
import { CheckoutController } from "../infraestructure/controllers/checkout.controller";
import { validateCheckout, verifyAuth } from "../infraestructure/middlewares/checkout.middleware";

const router = express.Router();

router.post("/checkout", verifyAuth, validateCheckout, CheckoutController.checkout);
router.post("/orders", verifyAuth, CheckoutController.placeOrder);
router.get("/orders", verifyAuth, CheckoutController.getOrders);
router.get("/orders/:order_id", verifyAuth, CheckoutController.getOrderById);
router.post("/orders/:order_id/stock", verifyAuth, CheckoutController.confirmStock);

export default router;
