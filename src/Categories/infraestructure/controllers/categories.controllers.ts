import { Request, Response } from "express";
import { CategoriesService } from "../../application/categories.service";
import { CategoriesRepository } from "../repositories/categories.repository";
import { Category } from "../../domain/categories.entity";

const categoriesService = new CategoriesService(new CategoriesRepository());

export const createCategory = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    payload.is_active = payload.is_active !== undefined ? Number(payload.is_active) : 1;

    const result = await categoriesService.createCategory(payload);
    res.status(201).json({ message: "Categoría creada con éxito", category: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al crear categoría" });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await categoriesService.getAllCategories();
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.category_id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const payload = req.body;
    if (payload.is_active !== undefined) payload.is_active = Number(payload.is_active);

    const updated = await categoriesService.updateCategory(id, payload);
    res.status(200).json({ message: "Categoría actualizada", category: updated });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.category_id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    await categoriesService.deleteCategory(id);
    res.status(200).json({ message: "Categoría eliminada" });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
