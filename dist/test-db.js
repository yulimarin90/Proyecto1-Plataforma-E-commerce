"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
async function testConnection() {
    try {
        const [rows] = await db_1.default.query("SELECT 1 + 1 AS result");
        console.log("✅ Conexión exitosa:", rows);
    }
    catch (err) {
        console.error("❌ Error en la conexión:", err);
    }
}
testConnection();
//# sourceMappingURL=test-db.js.map