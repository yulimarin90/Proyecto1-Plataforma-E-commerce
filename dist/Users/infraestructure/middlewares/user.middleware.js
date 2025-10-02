"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEditProfile = exports.validateLogout = exports.validateRefreshToken = exports.validateLogin = exports.validateRegister = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "clavesecreta";
// Ruta que quiera una autenticacion: obtener perfil, editar perfil, ver usuarios.
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ message: "Token requerido" });
    }
    const token = authHeader.split(" ")[1]; // "Bearer <token>"
    if (!token) {
        return res.status(401).json({ message: "Token inválido" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded; // se guarda el usuario en la request
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Token inválido o expirado" });
    }
};
exports.default = authMiddleware;
const validateRegister = (req, res, next) => {
    const { email, password, name } = req.body;
    //Campos obligatorios
    if (!email || !password || !name) {
        return res.status(400).json({ message: "Faltan campos obligatorios (name, email, password)" });
    }
    //Formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Formato inválido de email" });
    }
    //Longitud mínima de contraseña
    if (password.length < 6) {
        return res.status(400).json({ message: "Contraseña insegura, la contraseña debe tener mínimo 8 caracteres con mayúsculas, minúsculas y números" });
    }
    next(); //pasa al controller si todo funciona
};
exports.validateRegister = validateRegister;
//Validación de Login
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Faltan campos obligatorios (email, password)" }); // 400
    }
    next();
};
exports.validateLogin = validateLogin;
//Validación de Refresh Token
const validateRefreshToken = (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ message: "Token faltante o no enviado" }); // 401
    }
    try {
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" }); // 401
    }
};
exports.validateRefreshToken = validateRefreshToken;
//Validación de Logout
const validateLogout = (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Token faltante" }); // 400
    }
    next();
};
exports.validateLogout = validateLogout;
//Validación de Editar Perfil
const validateEditProfile = (req, res, next) => {
    const { password } = req.body;
    if (password && password.length < 8) {
        return res.status(400).json({
            message: "Contraseña inválida, debe tener mínimo 8 caracteres",
        }); // 400
    }
    next();
};
exports.validateEditProfile = validateEditProfile;
//# sourceMappingURL=user.middleware.js.map