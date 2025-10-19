//rutas HTTP de Express. Apunta cada endpoint a un controller y (opcionalmente) a un middleware.
/*
import { Router } from "express";
import * as UserController from "../infraestructure/controllers/user.controller";
import authMiddleware from "../infraestructure/middlewares/user.middleware";
import validateRegister from "../infraestructure/middlewares/user.middleware";
import { requireVerifiedEmail} from "../infraestructure/middlewares/user.middleware";


const router = Router();

// Rutas públicas
router.post("/auth/register", UserController.register,validateRegister);
router.post("/auth/login", UserController.login);
router.post("/auth/logout", UserController.logout);
router.post("/refresh", UserController.refreshToken);  

// Rutas protegidas
router.get("/users/me", authMiddleware, UserController.getProfile);
router.patch("/users/me", authMiddleware, UserController.updateAccount);
router.put("/users/me", authMiddleware, UserController.replaceAccount);
router.delete("/users/me", authMiddleware, UserController.deleteAccount);
router.post("/checkout", authMiddleware, requireVerifiedEmail);
router.get("/auth/verify", UserController.verifyEmail);

export default router;
*/

import { Router } from "express";
import * as UserController from "../infraestructure/controllers/user.controller";
import authMiddleware, {
  validateRegister,
  validateLogin,
  validateLogout,
  validateRefreshToken,
  validateEditProfile,
  requireVerifiedEmail
} from "../infraestructure/middlewares/user.middleware";

const router = Router();

// 🟢 Rutas públicas con validación
router.post("/auth/register", validateRegister, UserController.register);
router.post("/auth/login", validateLogin, requireVerifiedEmail, UserController.login);
router.post("/auth/logout", validateLogout, UserController.logout);
router.post("/refresh", validateRefreshToken, UserController.refreshToken);

// 🔒 Rutas protegidas con validación adicional
router.get("/users/me", authMiddleware, UserController.getProfile);
router.patch("/users/me", authMiddleware, validateEditProfile, UserController.updateAccount);
router.put("/users/me", authMiddleware, UserController.replaceAccount);
router.delete("/users/me", authMiddleware, UserController.deleteAccount);
router.post("/checkout", authMiddleware, requireVerifiedEmail);
router.get("/auth/verify", UserController.verifyEmail);

export default router;