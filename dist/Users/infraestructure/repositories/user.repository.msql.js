"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLUserRepository = void 0;
const db_1 = __importDefault(require("../../../config/db"));
class MySQLUserRepository {
    async create(user) {
        const [result] = await db_1.default.query(`INSERT INTO users (name, email, password, phone, direccion, created_at, failed_attempts, locked_until, is_verified, verification_token, verification_expires)
       VALUES (?, ?, ?, ?, ?, NOW(), 0, NULL, 0, ?, ?)`, [user.name, user.email, user.password, user.phone, user.direccion, user.verification_token, user.verification_expires]);
        return result.insertId;
    }
    async findByEmail(email) {
        const [rows] = await db_1.default.query("SELECT * FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findById(id) {
        const [rows] = await db_1.default.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async update(id, data) {
        const fields = Object.keys(data);
        if (fields.length === 0)
            return;
        const setClause = fields.map(f => `${f} = ?`).join(", ");
        const values = fields.map(f => data[f]);
        await db_1.default.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
    }
    async delete(id) {
        await db_1.default.query("DELETE FROM users WHERE id = ?", [id]);
    }
    async replace(id, data) {
        await db_1.default.query("UPDATE users SET name=?, email=?, phone=?, direccion=? WHERE id=?", [data.name, data.email, data.phone, data.direccion || null, id]);
    }
    async saveToken(userId, token) {
        await db_1.default.query("INSERT INTO tokens (user_id, token) VALUES (?, ?)", [userId, token]);
    }
    async deleteToken(token) {
        await db_1.default.query("DELETE FROM tokens WHERE token = ?", [token]);
    }
    async findToken(token) {
        const [rows] = await db_1.default.query("SELECT * FROM tokens WHERE token = ?", [token]);
        return rows.length > 0 ? rows[0] : null;
    }
    async verifyUser(id) {
        await db_1.default.query("UPDATE users SET is_verified=1, verification_token=NULL, verification_expires=NULL WHERE id=?", [id]);
    }
    async findByVerificationToken(token) {
        const [rows] = await db_1.default.query("SELECT * FROM users WHERE verification_token=?", [token]);
        return rows.length > 0 ? rows[0] : null;
    }
}
exports.MySQLUserRepository = MySQLUserRepository;
//# sourceMappingURL=user.repository.msql.js.map