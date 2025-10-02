"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketAdapter = void 0;
class SocketAdapter {
    constructor(io) {
        this.io = io;
    }
    initialize() {
        this.io.on("connection", (socket) => {
            console.log(`⚡ Nueva conexión: ${socket.id}`);
            // Evento de prueba
            socket.emit("welcome", "Bienvenido al servidor WebSocket 🚀");
            // Escuchar eventos del cliente
            socket.on("mensaje", (data) => {
                console.log("📩 Mensaje recibido:", data);
                // Aquí podrías llamar un caso de uso del dominio
                // ej: this.userService.sendMessage(data)
                socket.emit("respuesta", `Recibí tu mensaje: ${data}`);
            });
            socket.on("disconnect", () => {
                console.log(`❌ Cliente desconectado: ${socket.id}`);
            });
        });
    }
}
exports.SocketAdapter = SocketAdapter;
//# sourceMappingURL=socket.adapter.js.map