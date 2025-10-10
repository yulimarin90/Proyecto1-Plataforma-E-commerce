// categories/infraestructure/routes/category.route.ts
import { Router } from "express";
import * as CategoryController from "../infraestructure/controllers/categories.controllers";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import { validateCreateCategory, validateUpdateCategory, categoryExistsMiddleware } from "../infraestructure/middlewares/categories.middlewares";

const router = Router();

// Rutas públicas
router.get("/categories", CategoryController.getCategories);


// Rutas protegidas (admin)
router.post("/admin/categories", authMiddleware, validateCreateCategory, CategoryController.createCategory);
router.put("/admin/categories/:category_id", authMiddleware, categoryExistsMiddleware, validateUpdateCategory, CategoryController.updateCategory);
router.delete("/admin/categories/:category_id", authMiddleware, categoryExistsMiddleware, CategoryController.deleteCategory);

export default router;
