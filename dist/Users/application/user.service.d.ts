import { IUserRepository } from "../infraestructure/repositories/user.repository";
import { User } from "../domain/user.entity";
export declare class UserService {
    private userRepository;
    constructor(userRepository: IUserRepository);
    private readonly MAX_FAILED_ATTEMPTS;
    private readonly LOCK_TIME_MINUTES;
    register(data: Omit<User, "id">): Promise<{
        id: number;
        verificationToken: string;
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    updateAccount(userId: number, data: Partial<User>): Promise<{
        message: string;
    }>;
    replaceAccount(userId: number, data: Omit<User, "id">): Promise<{
        message: string;
    }>;
    deleteAccount(userId: number): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=user.service.d.ts.map