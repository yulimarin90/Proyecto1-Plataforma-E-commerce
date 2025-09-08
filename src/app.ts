
import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
app.use(express.json());

// Rutas
app.use("/api", userRoutes);

export default app;
