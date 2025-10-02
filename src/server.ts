import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { SocketAdapter } from "./websocket/socket.adapter";

const PORT = process.env.PORT || 4001;

// Crear servidor HTTP
const server = http.createServer(app);

// Crear instancia de socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Inicializar adaptador de WebSockets
const socketAdapter = new SocketAdapter(io);
socketAdapter.initialize();

// Levantar servidor
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
