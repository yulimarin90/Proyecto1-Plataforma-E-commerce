import { Router } from "express";
import { OrderController } from "../order.controller";
import { orderMiddleware } from "../order.middleware";

const router = Router();

// Crear orden
router.post("/", orderMiddleware.validateCreate, OrderController.createOrder);

// Listar todas las órdenes
router.get("/", OrderController.getOrders);

// Obtener una orden por ID
router.get("/:id", OrderController.getOrderById);

// Actualizar orden (ejemplo: cambiar estado, productos, etc.)
router.put("/:id", orderMiddleware.validateUpdate, OrderController.updateOrder);

// Eliminar orden
router.delete("/:id", OrderController.deleteOrder);

export default router;
