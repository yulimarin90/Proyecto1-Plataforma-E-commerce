// src/Checkout/infraestructure/routes/checkout.route.ts
import express from "express";
import { CheckoutController } from "../infraestructure/controllers/checkout.controller";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import { validateCheckout } from "../infraestructure/middlewares/checkout.middleware";

const router = express.Router();

router.post("/admin/checkout", authMiddleware, validateCheckout, CheckoutController.checkout);

export default router;
