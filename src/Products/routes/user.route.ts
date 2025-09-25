/*Define las rutas HTTP de Express.

Apunta cada endpoint a un controller y (opcionalmente) a un middleware.*/

import { Router } from "express";
import * as UserController from "../infraestructure/controllers/user.controller";
import authMiddleware from "../infraestructure/middlewares/user.middleware";

const router = Router();

// Rutas públicas
router.post("/auth/register", UserController.register);
router.post("/auth/login", UserController.login);

// Rutas protegidas
router.get("/users/me", authMiddleware, UserController.getProfile);
router.patch("/users/me", authMiddleware, UserController.updateAccount);
router.put("/users/me", authMiddleware, UserController.replaceAccount);
router.delete("/users/me", authMiddleware, UserController.deleteAccount);

export default router;
