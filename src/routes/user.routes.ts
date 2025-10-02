/*import { Router } from "express";
import * as UserController from "../controllers/user.controllers";
import authMiddleware from "../middlewares/auth.middlewares";

const router = Router();

// Auth
router.post("/auth/register", UserController.register);
router.post("/auth/login", UserController.login);
router.post("/auth/logout", UserController.logout);
router.post("/auth/refresh-token", UserController.refreshToken);

// Perfil (requiere token)
router.get("/users/me", authMiddleware, UserController.getProfile);
router.patch("/users/me", authMiddleware, UserController.updateAccount);
router.put("/users/me", authMiddleware, UserController.replaceAccount);  // completo
router.delete("/users/me", authMiddleware, UserController.deleteAccount);

export default router;
*/