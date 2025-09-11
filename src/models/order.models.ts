// models/order.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  usuario_id: mongoose.Types.ObjectId;
  productos: {
    producto_id: mongoose.Types.ObjectId;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  total: number;
  estado: string;
  seguimiento: {
    estado: string;
    comentario?: string;
    fecha: Date;
  }[];
  fecha_creacion: Date;
}

const OrderSchema = new Schema<IOrder>({
  usuario_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productos: [
    {
      producto_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      cantidad: { type: Number, required: true },
      precio_unitario: { type: Number, required: true },
      subtotal: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  estado: { type: String, default: "pendiente" },
  seguimiento: [
    {
      estado: { type: String, required: true },
      comentario: { type: String },
      fecha: { type: Date, default: Date.now },
    },
  ],
  fecha_creacion: { type: Date, default: Date.now },
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
