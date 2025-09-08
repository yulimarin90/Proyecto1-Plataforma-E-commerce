// conectamos rutas y controllers
import { Router } from "express";
import * as UserController from "../controllers/user.controllers";
import authMiddleware from "../middlewares/auth.middlewares";

const router = Router();

// Auth
router.post("/auth/register", UserController.register);
router.post("/auth/login", UserController.login);

// Perfil (requiere token)
router.get("/users/me", authMiddleware, UserController.getProfile);
router.put("/users/me", authMiddleware, UserController.updateProfile);
router.delete("/users/me", authMiddleware, UserController.deleteAccount);

export default router;
