//definimos url y a que controlador llaman

// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login } from "../controllers/user.controllers";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;
