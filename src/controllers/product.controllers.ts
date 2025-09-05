import { Request, Response } from "express";
import { Product } from "../models/product.models";

let products: Product[] = []; //REEMPLAZO CON  BD 

export const createProduct = (req: Request, res: Response) => {
  const { name, description, price, stock, categoryId, image} = req.body;

    if (!name || !price || !stock || !categoryId || !image) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const newProduct: Product = {
    id: products.length + 1,
    name,
    description,
    price,
    stock,
    categoryId,
    image,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
};

export const getProducts = (req: Request, res: Response) => {
  res.json(products);
};


/*
crear un nuevo producto
export const createProduct = (req: Request, res: Response) => {
  const { name, price } = req.body;
  const newProduct: Product = { id: products.length + 1, name, price };
  products.push(newProduct);
  res.status(201).json(newProduct);
};*/

export const updateProduct = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, price } = req.body;
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  product.name = name || product.name;
  product.price = price || product.price;
  res.json(product);
};

export const deleteProduct = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  products = products.filter(p => p.id !== id);
  res.json({ message: "Producto eliminado" });
};
