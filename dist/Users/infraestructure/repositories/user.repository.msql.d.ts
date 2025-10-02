import { User } from "../../domain/user.entity";
import { IUserRepository } from "../repositories/user.repository";
export declare class MySQLUserRepository implements IUserRepository {
    create(user: User): Promise<number>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    update(id: number, data: Partial<User>): Promise<void>;
    delete(id: number): Promise<void>;
    replace(id: number, data: User): Promise<void>;
    saveToken(userId: number, token: string): Promise<void>;
    deleteToken(token: string): Promise<void>;
    findToken(token: string): Promise<any>;
    verifyUser(id: number): Promise<void>;
    findByVerificationToken(token: string): Promise<User | null>;
}
//# sourceMappingURL=user.repository.msql.d.ts.map