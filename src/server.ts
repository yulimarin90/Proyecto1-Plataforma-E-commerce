// server.ts
import path from "path";
import dotenv from "dotenv";

// 👇 Forzamos ruta absoluta hacia la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { SocketAdapter } from "./websocket/socket.adapter";


console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const socketAdapter = new SocketAdapter(io);
socketAdapter.initialize();

server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});




