import { RowDataPacket } from "mysql2";
export interface User {
    id?: number;
    name: string;
    email: string;
    password: string;
    telefono: number;
    direccion?: string;
    created_at?: Date;
    failed_attempts?: number;
    locked_until?: Date | null;
    is_verified?: boolean;
    verification_token?: string | null;
    verification_expires?: Date | null;
}
export declare const createUser: (user: User) => Promise<number>;
export declare const findUserByEmail1: (email: string) => Promise<User | null>;
export declare const findUserByVerificationToken: (token: string) => Promise<User | null>;
export declare const verifyUser: (id: number) => Promise<void>;
export declare const findUserByEmail: (email: string) => Promise<User | null>;
export declare const findUserById: (id: number) => Promise<User | null>;
export declare const updateUser: (id: number, data: Partial<User>) => Promise<void>;
export declare const deleteUser: (id: number) => Promise<void>;
export declare const saveToken: (userId: number, token: string) => Promise<void>;
export declare const deleteToken: (token: string) => Promise<void>;
export declare const findToken: (token: string) => Promise<RowDataPacket | null | undefined>;
export declare const replaceUser: (id: number, data: {
    name: string;
    email: string;
    telefono: number;
    direccion?: string;
}) => Promise<void>;
//# sourceMappingURL=user.model.d.ts.map