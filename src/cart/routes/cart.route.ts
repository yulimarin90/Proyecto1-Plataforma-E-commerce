import { Router } from "express";
import { CartController } from "../infraestructure/controllers/cart.controller";
import { 
  authCartMiddleware, 
  ensureCartExists, 
  checkProductStock, 
  validateCartItem 
} from "../infraestructure/middlewares/cart.middleware";
import { validateCartBeforeCheckout } from "../infraestructure/middlewares/cart.middleware";
import { CheckoutController } from "../../Checkout/infraestructure/controllers/checkout.controller";
const router = Router();
const controller = new CartController();


router.use(authCartMiddleware, ensureCartExists);

//ver carrito por el usuario
router.get("/cart", controller.viewCart.bind(controller));

//agregar productos al carrito
router.post("/cart/items", validateCartItem, checkProductStock, controller.addItem.bind(controller));
router.patch("/cart/items/:productId", validateCartItem, controller.updateQuantity.bind(controller));
//eliminar productos del carrito 
router.delete("/cart/items/:productId", controller.removeItem.bind(controller));
//eliminar carrito completamente
router.delete("/cart/clear", controller.clearCart.bind(controller));

router.post("/cart/checkout", validateCartBeforeCheckout, CheckoutController.checkout);

export default router;
