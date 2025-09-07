// routes/product.route.ts
import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controllers";

const router = Router();

// Crear un producto
router.post("/", createProduct);

// Listar todos los productos
router.get("/", getProducts);

// Obtener un producto por ID
router.get("/:id", getProductById);

// Actualizar un producto
router.put("/:id", updateProduct);

// Eliminar un producto
router.delete("/:id", deleteProduct);

