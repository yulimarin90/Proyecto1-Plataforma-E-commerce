import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/product.controllers";

const router = Router();

router.get("/", getProducts);          // GET /products
router.get("/:id", getProductById);    // GET /products/:id
router.post("/", createProduct);       // POST /products
router.put("/:id", updateProduct);     // PUT /products/:id-editar
router.delete("/:id", deleteProduct);  // DELETE /products/:id
//ver producto - categoria 

export default router;
