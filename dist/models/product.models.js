"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
// models/product.model.ts
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    nombre: { type: String, required: true, unique: true },
    imagen: { type: String },
    descripcion: { type: String },
    precio: { type: Number, required: true },
    stock: { type: Number, required: true },
    cantidad: { type: Number, default: 0 },
    categoria_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Categoria", required: true },
    estado: { type: Boolean, default: true },
}, { timestamps: true });
exports.Product = (0, mongoose_1.model)("Product", productSchema);
//# sourceMappingURL=product.models.js.map