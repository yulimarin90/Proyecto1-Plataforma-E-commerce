
import { Router } from "express";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  cancelOrder,
  assignTracking,
  getAllOrders
} from "../infraestructure/controllers/order.controller";

const router = Router();



router.get("/admin/orders/user/:user_id", authMiddleware, getOrdersByUser);
router.get("/admin/orders/:order_id", authMiddleware, getOrderById);
router.put("/admin/orders/:order_id/cancel", authMiddleware, cancelOrder);


router.post("/admin/orders", authMiddleware, createOrder);
//router.put("/admin/orders/:order_id/tracking", authMiddleware, assignTracking);
router.get("/admin/orders", authMiddleware, getAllOrders);


export default router;
