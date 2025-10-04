// app.ts
import express from "express";
import userRoutes from "./Users/routes/user.route";

const app = express();

app.use(express.json());

// Rutas
app.use("/api", userRoutes);

// Endpoint raíz
app.get("/", (req, res) => {
  res.send("🚀 API funcionando");
});

export default app;
