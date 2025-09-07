// controllers/product.controller.ts
import { Request, Response } from "express";
import { Product } from "../models/product.models";
//import { Category } from "../models/category.models";

// Crear producto
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { nombre, imagen, descripcion, precio, stock, cantidad, categoria_id, estado } = req.body;

    // Validar si el producto ya existe (por nombre, por ejemplo)
    const existingProduct = await Product.findOne({ nombre });
    if (existingProduct) return res.status(400).json({ message: "El producto ya existe" });

    // Crear producto
    const product = new Product({ nombre, imagen, descripcion, precio, stock, cantidad, categoria_id, estado });
    await product.save();

    res.status(201).json({ message: "Producto creado correctamente", product });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Listar productos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().populate("categoria_id");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Obtener un producto por ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("categoria_id");
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Actualizar producto
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto actualizado", product });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Eliminar producto
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

/*
// Crear categoría
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, estado } = req.body;

    // Verificar duplicado
    const existingCategory = await Category.findOne({ nombre });
    if (existingCategory) {
      return res.status(400).json({ message: "La categoría ya existe" });
    }

    const category = new Category({ nombre, descripcion, estado });
    await category.save();

    res.status(201).json({ message: "Categoría creada correctamente", category });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Obtener todas las categorías
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// Eliminar categoría
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
}; */