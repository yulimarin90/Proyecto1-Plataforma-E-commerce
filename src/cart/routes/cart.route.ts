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

/**
 * Todas las rutas del carrito requieren autenticación,
 * asegurarse que el carrito exista y esté vigente.
 */
router.use(authCartMiddleware, ensureCartExists);

/**
 * 🛒 Ver carrito del usuario
 * GET /api/cart
 */
router.get("/cart", controller.viewCart);

/**
 * ➕ Agregar producto al carrito
 * POST /api/cart/items
 * Requiere validar stock y body
 */
router.post("/cart/items", validateCartItem, checkProductStock, controller.addItem.bind(controller));

/**
 * ✏️ Actualizar cantidad de un ítem del carrito
 * PATCH /api/cart/items/:productId
 */
router.patch("/cart/items/:productId", validateCartItem, controller.updateQuantity.bind(controller));

/**
 * 🗑️ Eliminar ítem del carrito
 * DELETE /api/cart/items/:productId
 */
router.delete("/cart/items/:productId", controller.removeItem.bind(controller));

/**
 * 🧹 Vaciar carrito completamente
 * DELETE /api/cart/clear
 */
router.delete("/cart/clear", controller.clearCart.bind(controller));

router.post("/cart/checkout", validateCartBeforeCheckout, CheckoutController.checkout);

export default router;
