"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("../infraestructure/controllers/products.controller");
const router = (0, express_1.Router)();
const controller = new products_controller_1.ProductController();
router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));
exports.default = router;
//# sourceMappingURL=products.route.js.map