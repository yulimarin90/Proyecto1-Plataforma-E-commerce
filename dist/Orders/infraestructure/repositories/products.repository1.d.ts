import { Schema } from "mongoose";
export declare const Product: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    nombre: string;
    precio: number;
    stock: number;
    estado: boolean;
    cantidad: number;
    categoria_id: import("mongoose").Types.ObjectId;
    descripcion?: string | null;
    imagen?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    nombre: string;
    precio: number;
    stock: number;
    estado: boolean;
    cantidad: number;
    categoria_id: import("mongoose").Types.ObjectId;
    descripcion?: string | null;
    imagen?: string | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    nombre: string;
    precio: number;
    stock: number;
    estado: boolean;
    cantidad: number;
    categoria_id: import("mongoose").Types.ObjectId;
    descripcion?: string | null;
    imagen?: string | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    nombre: string;
    precio: number;
    stock: number;
    estado: boolean;
    cantidad: number;
    categoria_id: import("mongoose").Types.ObjectId;
    descripcion?: string | null;
    imagen?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    nombre: string;
    precio: number;
    stock: number;
    estado: boolean;
    cantidad: number;
    categoria_id: import("mongoose").Types.ObjectId;
    descripcion?: string | null;
    imagen?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    nombre: string;
    precio: number;
    stock: number;
    estado: boolean;
    cantidad: number;
    categoria_id: import("mongoose").Types.ObjectId;
    descripcion?: string | null;
    imagen?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=products.repository1.d.ts.map