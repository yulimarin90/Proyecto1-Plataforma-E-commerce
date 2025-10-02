"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Rutas
app.use("/api", user_routes_1.default);
// Endpoint raíz
app.get("/", (req, res) => {
    res.send("🚀 API funcionando");
});
exports.default = app;
//# sourceMappingURL=app.js.map