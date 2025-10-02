"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceAccount = exports.deleteAccount = exports.updateAccount = exports.getProfile = exports.refreshToken = exports.logout = exports.login = exports.verifyEmail = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const db_1 = __importDefault(require("../config/db"));
const UserModel = __importStar(require("../models/user.model"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecreto";
// Registro con verificación
const register = async (req, res) => {
    try {
        const { name, email, password, telefono, direccion } = req.body;
        const existingUser = await UserModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Generar token de verificación
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        const userId = await UserModel.createUser({
            name,
            email,
            password: hashedPassword,
            telefono,
            direccion,
            verification_token: verificationToken,
            verification_expires: verificationExpires,
            /*
              user.created_at,
              user.failed_attempts,
              user.locked_until,
        */
        });
        // Enviar email con el enlace
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Confirma tu correo",
            html: `<p>Hola ${name},</p>
             <p>Por favor confirma tu correo dando clic en el siguiente enlace:</p>
             <a href="${verificationUrl}">${verificationUrl}</a>`,
        });
        res.status(201).json({ message: "Usuario creado. Revisa tu correo para confirmar la cuenta." });
    }
    catch (error) {
        res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.register = register;
// Verificación de correo
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            return res.status(400).json({ message: "Token inválido" });
        }
        const user = await UserModel.findUserByVerificationToken(token);
        if (!user) {
            return res.status(400).json({ message: "Token no válido" });
        }
        if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
            return res.status(400).json({ message: "Token expirado" });
        }
        await UserModel.verifyUser(user.id);
        res.json({ message: "Correo verificado correctamente. Ya puedes iniciar sesión." });
    }
    catch (error) {
        res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.verifyEmail = verifyEmail;
// Login de usuario
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Buscar usuario
        const user = await (0, user_model_1.findUserByEmail)(email);
        if (!user)
            return res.status(401).json({ message: "Usuario no encontrado" });
        // Verificar si está bloqueado, edpoint 
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({
                message: `Cuenta bloqueada. Intenta de nuevo después de ${user.locked_until}`,
            });
        }
        // Comparar contraseñas
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            const failed = (user.failed_attempts || 0) + 1;
            let lockedUntil = null;
            if (failed >= 3) {
                const bloqueado = new Date();
                bloqueado.setMinutes(bloqueado.getMinutes() + 15);
                lockedUntil = bloqueado;
            }
            await db_1.default.query("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", [failed, lockedUntil, user.id]);
            return res.status(401).json({
                message: failed >= 3
                    ? "Cuenta bloqueada por 15 minutos"
                    : `Contraseña incorrecta. Intentos fallidos: ${failed}/3`,
            });
        }
        // Si contraseña es correcta → resetear intentos fallidos
        await db_1.default.query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [user.id]);
        // Generar tokens
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "15m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: "7d" });
        await (0, user_model_1.saveToken)(user.id, refreshToken);
        res.json({ token, refreshToken });
    }
    catch (error) {
        res.status(500).json({ message: "Error en el login", error });
    }
};
exports.login = login;
// Logout
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: "Refresh token requerido" });
        await (0, user_model_1.deleteToken)(refreshToken);
        res.json({ message: "Sesión cerrada" });
    }
    catch (error) {
        res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.logout = logout;
// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: "Refresh token requerido" });
        const tokenInDb = await (0, user_model_1.findToken)(refreshToken);
        if (!tokenInDb)
            return res.status(403).json({ message: "Token inválido o expirado" });
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const newToken = jsonwebtoken_1.default.sign({ id: decoded.id, email: decoded.email }, JWT_SECRET, { expiresIn: "15m" });
        res.json({ token: newToken });
    }
    catch (error) {
        res.status(403).json({ message: "Token inválido o expirado", error });
    }
};
exports.refreshToken = refreshToken;
// edpoint ver perfil
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await (0, user_model_1.findUserById)(userId);
        if (!user)
            return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.getProfile = getProfile;
// Actualizar perfil (PATCH)
const updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, user_model_1.updateUser)(userId, req.body);
        res.json({ message: "Perfil actualizado" });
    }
    catch (error) {
        res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.updateAccount = updateAccount;
// Eliminar cuenta
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, user_model_1.deleteUser)(userId);
        res.json({ message: "Cuenta eliminada" });
    }
    catch (error) {
        res.status(500).json({ message: "Error en el servidor", error });
    }
};
exports.deleteAccount = deleteAccount;
// Actualizar perfil completo (PUT)
const replaceAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, telefono, direccion } = req.body;
        if (!name || !email || !telefono) {
            return res
                .status(400)
                .json({ message: "Faltan campos obligatorios (name, email, telefono)" });
        }
        await (0, user_model_1.replaceUser)(userId, { name, email, telefono, direccion });
        res.json({ message: "Perfil reemplazado correctamente" });
    }
    catch (error) {
        res.status(500).json({ message: "Error al reemplazar perfil", error });
    }
};
exports.replaceAccount = replaceAccount;
//# sourceMappingURL=user.controllers.js.map