
// products/infraestructure/controllers/products.controller.ts
import { Request, Response } from "express";
import { ProductsService } from "../../application/products.service";

export class ProductController {
  static async createProduct(req: Request, res: Response) {
    try {
      const payload = req.body;
      if (req.file) payload.imagen = req.file.path;

      const result = await ProductsService.createProduct(payload);
      if (result === "ALREADY_EXISTS") {
        return res.status(409).json({ message: "Ya existe un producto con ese nombre" });
      }
      return res.status(201).json({ message: "Producto agregado con éxito", product: result });
    } catch (err) {
      return res.status(500).json({ message: "Error al crear producto", error: err });
    }
  }

  static async getProducts(_req: Request, res: Response) {
    const products = await ProductsService.getAllProducts();
    return res.status(200).json(products);
  }

  static async getProductById(req: Request, res: Response) {
    const product = await ProductsService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "El producto no existe" });
    return res.status(200).json(product);
  }

  static async updateProduct(req: Request, res: Response) {
    const payload = req.body;
    if (req.file) payload.imagen = req.file.path;

    const updated = await ProductsService.updateProduct(req.params.product_id, payload);
    if (updated === "NOT_FOUND") return res.status(404).json({ message: "Producto no encontrado" });
    if (updated === "CONFLICT") return res.status(409).json({ message: "Nombre ya en uso" });
    return res.status(200).json({ message: "Producto actualizado con éxito", product: updated });
  }

  static async deleteProduct(req: Request, res: Response) {
    const deleted = await ProductsService.deleteProduct(req.params.product_id);

    if (deleted === "NOT_FOUND") 
      return res.status(404).json({ message: "Producto no encontrado" });

    if (deleted === "HAS_ORDERS") 
      return res.status(400).json({ message: "No se puede eliminar, tiene órdenes asociadas" });

    return res.status(204).send();
  }

  static async getProductsByCategory(req: Request, res: Response) {
    const products = await ProductsService.getProductsByCategory(req.params.id);
    return res.status(200).json(products);
  }
}