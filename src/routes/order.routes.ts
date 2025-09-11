// routes/order.route.ts
import { Router } from "express";
import {
  createOrder,
  getOrders,
  verifyPurchase,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  assignTracking,
} from "../controllers/order.controllers";

const router = Router();

router.post("/", createOrder); // Crear orden
router.get("/", getOrders); // Obtener todas las órdenes
router.get("/verify/:id", verifyPurchase); // Verificar compra
router.get("/user/:userId", getUserOrders); // Órdenes de un usuario
router.get("/:id/details", getOrderDetails); // Detalles de una orden
router.patch("/:id/cancel", cancelOrder); // Cancelar orden
router.post("/:id/tracking", assignTracking); // Asignar seguimiento

export default router;
