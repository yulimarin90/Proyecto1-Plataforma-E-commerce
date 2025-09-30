// models/product.model.ts
import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    nombre: { type: String, required: true, unique: true },
    imagen: { type: String },
    descripcion: { type: String },
    precio: { type: Number, required: true },
    stock: { type: Number, required: true },
    cantidad: { type: Number, default: 0 },
    categoria_id: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    estado: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
