import { Server, Socket } from "socket.io";

export class SocketAdapter {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public initialize() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`Nueva conexión: ${socket.id}`);

      // Mensaje de bienvenida
      socket.emit("welcome", {
        message: "Bienvenido al servidor WebSocket",
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Evento genérico de mensaje
      socket.on("mensaje", (data: { text: string; from?: string }) => {
        console.log("Mensaje recibido:", data);

        // Aquí podrías llamar un caso de uso del dominio
        // ej: this.userService.sendMessage(data)

        socket.emit("respuesta", {
          message: `Recibí tu mensaje: ${data.text}`,
          timestamp: new Date().toISOString()
        });
      });

      // Evento de desconexión
      socket.on("disconnect", () => {
        console.log(`Cliente desconectado: ${socket.id}`);
      });
    });
  }
}
