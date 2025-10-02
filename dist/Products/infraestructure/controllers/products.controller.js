"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const products_service_1 = require("../../application/products.service");
const service = new products_service_1.ProductService();
class ProductController {
    async create(req, res) {
        const product = await service.create(req.body);
        res.status(201).json(product);
    }
    async getAll(_req, res) {
        const products = await service.findAll();
        res.json(products);
    }
    async getById(req, res) {
        const product = await service.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Producto no encontrado" });
        res.json(product);
    }
    async update(req, res) {
        const product = await service.update(req.params.id, req.body);
        if (!product)
            return res.status(404).json({ message: "Producto no encontrado" });
        res.json(product);
    }
    async delete(req, res) {
        const result = await service.delete(req.params.id);
        if (!result)
            return res.status(404).json({ message: "Producto no encontrado" });
        res.json({ message: "Producto eliminado" });
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=products.controller.js.map