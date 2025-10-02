import { Server, Socket } from "socket.io";

export class SocketAdapter {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public initialize() {
    this.io.on("connection", (socket: Socket) => {
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
