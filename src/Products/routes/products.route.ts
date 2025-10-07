// src/routes/products.route.ts
import { Router } from "express";
import multer from "multer"; //multer lo usas para manejar imágenes (por eso aparece req.file)
                             //un middleware de Node.js/Express que sirve para manejar archivos subidos en peticiones HTTP

// Ajusta la ruta según el nombre real de tu carpeta (ver notas más abajo)
import { ProductController } from "../infraestructure/controllers/products.controller";
import { productMiddleware } from "../infraestructure/middlewares/products.middleware";
import authMiddleware  from "../../middlewares/auth.middlewares";

const router = Router();
const upload = multer({ dest: "uploads/" }); // o tu config de storage (S3, disk, etc.)


/**
 * ADMIN ROUTES (se usan en tu doc: /admin/products ...)
 * - POST   /admin/products           -> añadir producto (imagen file)
 * - PUT    /admin/products/:product_id -> actualizar producto (imagen file opcional)
 * - DELETE /admin/products/:product_id -> eliminar (si no hay órdenes asociadas)
 */
router.post(
  "/admin/products",
  authMiddleware,                    // proteges con auth si corresponde
  upload.single("imagen"),           // recibir file en 'imagen'
  productMiddleware.validateCreate,
  ProductController.createProduct
);

router.put(
  "/admin/products/:product_id",
  authMiddleware,
  upload.single("imagen"),
  productMiddleware.validateUpdate,
  ProductController.updateProduct
);

router.delete(
  "/admin/products/:product_id",
  authMiddleware,
  productMiddleware.checkNoOrdersAssociated, // valida que no existan órdenes asociadas
  ProductController.deleteProduct
);

/**
 * PUBLIC ROUTES
 * - GET /products           -> lista productos (filtros/paginación opcional)
 * - GET /products/:id       -> ver producto específico
 * - GET /categories/:id     -> listar productos por categoría (si lo implementas)
 */
router.get("/products", ProductController.getProducts);
router.get("/products/:id", productMiddleware.checkProductExists, ProductController.getProductById);
router.get("/categories/:id", ProductController.getProductsByCategory);


export default router;
