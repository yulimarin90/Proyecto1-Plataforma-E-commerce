"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/order.route.ts
const express_1 = require("express");
const order_controllers_1 = require("../controllers/order.controllers");
const router = (0, express_1.Router)();
router.post("/", order_controllers_1.createOrder); // Crear orden
router.get("/", order_controllers_1.getOrders); // Obtener todas las órdenes
router.get("/verify/:id", order_controllers_1.verifyPurchase); // Verificar compra
router.get("/user/:userId", order_controllers_1.getUserOrders); // Órdenes de un usuario
router.get("/:id/details", order_controllers_1.getOrderDetails); // Detalles de una orden
router.patch("/:id/cancel", order_controllers_1.cancelOrder); // Cancelar orden
router.post("/:id/tracking", order_controllers_1.assignTracking); // Asignar seguimiento
exports.default = router;
//# sourceMappingURL=order.routes.js.map