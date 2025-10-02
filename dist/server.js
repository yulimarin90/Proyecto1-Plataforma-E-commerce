"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const socket_adapter_1 = require("./websocket/socket.adapter");
const PORT = process.env.PORT || 4001;
// Crear servidor HTTP
const server = http_1.default.createServer(app_1.default);
// Crear instancia de socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
// Inicializar adaptador de WebSockets
const socketAdapter = new socket_adapter_1.SocketAdapter(io);
socketAdapter.initialize();
// Levantar servidor
server.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map