import { Router } from "express";
import multer from "multer";
import * as ProductController from "../infraestructure/controllers/products.controller";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import {
  productExistsMiddleware,
  validateCreateProduct,
  validateUpdateProduct,
  checkNoOrdersAssociated,
} from "../infraestructure/middlewares/products.middleware";

const router = Router();
const upload = multer({ dest: "uploads/" });

// Rutas públicas
router.get("/products", ProductController.getProducts);               
router.get("/products/:id", productExistsMiddleware, ProductController.getProductById); 
router.get("/categories/:id", ProductController.getProductsByCategory);  

// Rutas protegidas
router.post(
  "/admin/products",
  authMiddleware,
  upload.single("imagen"),
  validateCreateProduct,
  ProductController.createProduct
);

router.put(
  "/admin/products/:product_id",
  authMiddleware,
  upload.single("imagen"),
  validateUpdateProduct,
  productExistsMiddleware,
  ProductController.updateProduct
);

router.delete(
  "/admin/products/:product_id",
  authMiddleware,
  productExistsMiddleware,
  checkNoOrdersAssociated,
  ProductController.deleteProduct
);

export default router;
