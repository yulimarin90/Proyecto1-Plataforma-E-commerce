"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceUser = exports.findToken = exports.deleteToken = exports.saveToken = exports.deleteUser = exports.updateUser = exports.findUserById = exports.findUserByEmail = exports.verifyUser = exports.findUserByVerificationToken = exports.findUserByEmail1 = exports.createUser = void 0;
// consultas SQL que interactúan con la base de datos
const db_1 = __importDefault(require("../config/db")); // Conexión MySQL
// Crear usuario con token de verificación
const createUser = async (user) => {
    const [result] = await db_1.default.query(`INSERT INTO users (name, email, password, telefono, direccion, created_at, failed_attempts,   
       locked_until, is_verified, verification_token, verification_expires) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`, [
        user.name,
        user.email,
        user.password,
        user.telefono,
        user.direccion,
        user.created_at,
        user.failed_attempts,
        user.locked_until,
        user.verification_token,
        user.verification_expires,
    ]);
    return result.insertId;
};
exports.createUser = createUser;
const findUserByEmail1 = async (email) => {
    const [rows] = await db_1.default.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows.length > 0 ? rows[0] : null;
};
exports.findUserByEmail1 = findUserByEmail1;
const findUserByVerificationToken = async (token) => {
    const [rows] = await db_1.default.query("SELECT * FROM users WHERE verification_token = ?", [token]);
    return rows.length > 0 ? rows[0] : null;
};
exports.findUserByVerificationToken = findUserByVerificationToken;
const verifyUser = async (id) => {
    await db_1.default.query("UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?", [id]);
};
exports.verifyUser = verifyUser;
// Buscar usuario por email
const findUserByEmail = async (email) => {
    const [rows] = await db_1.default.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows.length > 0 ? rows[0] : null;
};
exports.findUserByEmail = findUserByEmail;
// Buscar usuario por id
const findUserById = async (id) => {
    const [rows] = await db_1.default.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
};
exports.findUserById = findUserById;
// Actualizar usuario (PATCH dinámico)
const updateUser = async (id, data) => {
    const allowedFields = ["name", "email", "telefono", "direccion", "password"];
    const fields = Object.keys(data).filter((f) => allowedFields.includes(f));
    if (fields.length === 0)
        return;
    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => data[f]);
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    await db_1.default.query(query, [...values, id]);
};
exports.updateUser = updateUser;
// Eliminar usuario
const deleteUser = async (id) => {
    await db_1.default.query("DELETE FROM users WHERE id = ?", [id]);
};
exports.deleteUser = deleteUser;
// Guardar token de refresh
const saveToken = async (userId, token) => {
    await db_1.default.query("INSERT INTO tokens (user_id, token) VALUES (?, ?)", [
        userId,
        token,
    ]);
};
exports.saveToken = saveToken;
// Eliminar token
const deleteToken = async (token) => {
    await db_1.default.query("DELETE FROM tokens WHERE token = ?", [token]);
};
exports.deleteToken = deleteToken;
// Buscar token
const findToken = async (token) => {
    const [rows] = await db_1.default.query("SELECT * FROM tokens WHERE token = ?", [token]);
    return rows.length > 0 ? rows[0] : null;
};
exports.findToken = findToken;
// put perfil
const replaceUser = async (id, data) => {
    await db_1.default.query("UPDATE users SET name = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?", [data.name, data.email, data.telefono, data.direccion || null, id]);
};
exports.replaceUser = replaceUser;
//# sourceMappingURL=user.model.js.map