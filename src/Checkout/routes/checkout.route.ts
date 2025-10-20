import { Router } from "express";
import { CheckoutController } from "../infraestructure/controllers/checkout.controller";
import { authCartMiddleware } from "../../cart/infraestructure/middlewares/cart.middleware";
//import { validateCheckout } from "../infraestructure/middlewares/checkout.middleware";

const router = Router();

// Proteger rutas de checkout con autenticación
router.use(authCartMiddleware);

// Procesar checkout
router.post("/checkout", authCartMiddleware, CheckoutController.checkout);

export default router;
