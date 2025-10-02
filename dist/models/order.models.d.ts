import mongoose, { Document } from "mongoose";
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
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=order.models.d.ts.map