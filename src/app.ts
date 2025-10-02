import express from "express";
import dotenv from "dotenv";
import userRoutes from "./Users/routes/user.route";

dotenv.config();

const app = express();

app.use(express.json());

// Rutas
app.use("/api", userRoutes);

// Endpoint raíz
app.get("/", (req, res) => {
  res.send("🚀 API funcionando");
});

export default app;
