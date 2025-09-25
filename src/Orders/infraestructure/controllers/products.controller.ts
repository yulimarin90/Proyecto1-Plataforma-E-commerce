import { Request, Response } from "express";
import { ProductService } from "../../application/products.service";

const service = new ProductService();

export class ProductController {
  async create(req: Request, res: Response) {
    const product = await service.create(req.body);
    res.status(201).json(product);
  }

  async getAll(_req: Request, res: Response) {
    const products = await service.findAll();
    res.json(products);
  }

  async getById(req: Request, res: Response) {
    const product = await service.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  }

  async update(req: Request, res: Response) {
    const product = await service.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  }

  async delete(req: Request, res: Response) {
    const result = await service.delete(req.params.id);
    if (!result) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  }
}
