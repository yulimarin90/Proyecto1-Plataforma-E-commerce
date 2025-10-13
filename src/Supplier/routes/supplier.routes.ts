import { Router } from "express";
import * as SuppliersController from "../infraestructure/controllers/supplier.controller";
import authMiddleware from "../../Users/infraestructure/middlewares/user.middleware";
import { validateCreateSupplier, validateUpdateSupplier, supplierExistsMiddleware } from "../infraestructure/middlewares/supplier.middlewares";
const router = Router();

// ruta publica
router.get("/suppliers", SuppliersController.getSuppliers);

//ruta protegida
router.post("/admin/suppliers", authMiddleware, validateCreateSupplier, SuppliersController.createSupplier);
router.put("/admin/suppliers/:supplier_id", authMiddleware, supplierExistsMiddleware, validateUpdateSupplier, SuppliersController.updateSupplier);
router.delete("/admin/suppliers/:supplier_id", authMiddleware, supplierExistsMiddleware, SuppliersController.deleteSupplier);



export default router;