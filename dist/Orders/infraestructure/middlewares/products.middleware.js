"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProductExists = exports.validateProductBody = void 0;
const products_repository1_1 = require("../repositories/products.repository1"); // 
// Valida el body para crear/actualizar producto
const validateProductBody = (req, res, next) => {
    const { nombre, precio, stock, categoria_id } = req.body;
    if (!nombre || typeof nombre !== "string") {
        return res.status(400).json({ message: "nombre es requerido y debe ser string" });
    }
    if (precio == null || typeof precio !== "number") {
        return res.status(400).json({ message: "precio es requerido y debe ser number" });
    }
    if (stock == null || typeof stock !== "number") {
        return res.status(400).json({ message: "stock es requerido y debe ser number" });
    }
    if (!categoria_id) {
        return res.status(400).json({ message: "categoria_id es requerido" });
    }
    next();
};
exports.validateProductBody = validateProductBody;
// Comprueba que exista el producto (usa en rutas que reciban :id)
const checkProductExists = async (req, res, next) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ message: "Parametro id requerido" });
    try {
        const product = await products_repository1_1.Product.findById(id);
        if (!product)
            return res.status(404).json({ message: "Producto no encontrado" });
        req.product = product; // lo dejamos accesible para el controller si se necesita
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.checkProductExists = checkProductExists;
//# sourceMappingURL=products.middleware.js.map