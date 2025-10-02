"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecreto";
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        // Constantes de la clase
        this.MAX_FAILED_ATTEMPTS = 3;
        this.LOCK_TIME_MINUTES = 15;
    }
    // Registro
    async register(data) {
        const existing = await this.userRepository.findByEmail(data.email);
        if (existing)
            throw new Error("El correo ya está registrado");
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const id = await this.userRepository.create({
            ...data,
            password: hashedPassword,
            verification_token: verificationToken,
            verification_expires: verificationExpires,
        });
        return { id, verificationToken };
    }
    // Login
    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw { status: 404, message: "Usuario no encontrado" };
        }
        // Verificar bloqueo
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            throw { status: 429, message: `Cuenta bloqueada hasta ${user.locked_until}` };
        }
        // Verificar contraseña
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            const failed = (user.failed_attempts || 0) + 1;
            let lockedUntil = null;
            if (failed >= this.MAX_FAILED_ATTEMPTS) {
                lockedUntil = new Date(Date.now() + this.LOCK_TIME_MINUTES * 60 * 1000);
            }
            await this.userRepository.update(user.id, {
                failed_attempts: failed,
                locked_until: lockedUntil,
            });
            if (failed >= this.MAX_FAILED_ATTEMPTS) {
                throw { status: 429, message: "Cuenta bloqueada por demasiados intentos fallidos" };
            }
            else {
                throw { status: 401, message: `Contraseña incorrecta. Intentos: ${failed}/${this.MAX_FAILED_ATTEMPTS}` };
            }
        }
        // Resetear intentos fallidos al loguearse
        await this.userRepository.update(user.id, {
            failed_attempts: 0,
            locked_until: null,
        });
        // Generar tokens
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: "7d" });
        await this.userRepository.saveToken(user.id, refreshToken);
        return { token, refreshToken };
    }
    // revisar de aca hacia abajo 
    async updateAccount(userId, data) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw { status: 404, message: "Usuario no encontrado" };
        await this.userRepository.update(userId, data);
        return { message: "Usuario actualizado parcialmente" };
    }
    async replaceAccount(userId, data) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw { status: 404, message: "Usuario no encontrado" };
        await this.userRepository.replace(userId, data);
        return { message: "Usuario reemplazado completamente" };
    }
    async deleteAccount(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw { status: 404, message: "Usuario no encontrado" };
        await this.userRepository.delete(userId);
        return { message: "Usuario eliminado correctamente" };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map