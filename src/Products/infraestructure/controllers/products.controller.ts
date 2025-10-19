import { Request, Response } from "express";
import { ProductsService } from "../../application/products.service";
import { ProductsRepository } from "../repositories/products.repository";
import { Product } from "../../domain/products.entity"; // ajusta la ruta según tu proyecto


let productsService = new ProductsService(new ProductsRepository());

// Setter para pruebas: permite inyectar un mock desde los tests de integración
export const setProductsService = (svc: any) => {
  productsService = svc;
};
type ProductResponse = Product & { price_formatted: string };


// Crear producto
export const createProduct = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    
    if (req.file) payload.image_url = req.file.path;
    

    // convertir cualquier valor a 0 o 1
    const parseBoolToNumber = (value: any, defaultValue: number): number => {
  if (value === undefined || value === null) return defaultValue;

  
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "true" || normalized === "1" || normalized === "yes") return 1;
  if (normalized === "false" || normalized === "0" || normalized === "no") return 0;

  return defaultValue;
};


    // Convertir booleanos a número
    payload.is_active = parseBoolToNumber(payload.is_active, 1);
payload.is_discontinued = parseBoolToNumber(payload.is_discontinued, 0);


    
    const result = await productsService.createProduct(payload);

    res.status(201).json({ message: "Producto agregado con éxito", product: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Error al crear producto" });
  }
};



// Obtener todos los productos
export const getProducts = async (_req: Request, res: Response) => {
  try {
    let products = await productsService.getAllProducts();

    // Filtrar productos activos, con stock > 0 y con imagen
    products = products.filter(
      (p) => Number(p.is_active) === 1 && p.stock > 0 && p.image_url
    );

    // Formatear precio
    const currency = "USD";
    products = products.map((p) => ({
      ...p,
      price: Number(p.price), 
      price_formatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(Number(p.price)),
    }));

    res.status(200).json(products);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.product_id || req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de producto inválido o faltante" });
    }

    const payload = req.body;
    if (req.file) payload.image_url = req.file.path;

   
    const parseBoolToNumber = (value: any): number | undefined => {
      if (value === undefined || value === null) return undefined;
      if (value === true || value === "true" || value === "1" || value === 1) return 1;
      return 0;
    };

    payload.is_active = parseBoolToNumber(payload.is_active);
    payload.is_discontinued = parseBoolToNumber(payload.is_discontinued);

    const updated = await productsService.updateProduct(id, payload);
    res.status(200).json({ message: "Producto actualizado con éxito", product: updated });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};



// Eliminar producto
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.product_id || req.params.id;
    const id = Number(idParam);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de producto inválido o faltante" });
    }

    await productsService.deleteProduct(id);
    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Obtener producto por ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id || req.params.product_id;
    const id = Number(idParam);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de producto inválido o faltante" });
    }

    const product = await productsService.getProductById(id);

    // Validar que el producto exista y cumpla condiciones
    if (
      !product ||
      Number(product.is_active) !== 1 ||
      Number(product.stock) <= 0 ||
      !product.image_url ||
      Number(product.is_discontinued) === 1
    ) {
      return res.status(404).json({ message: "Producto no encontrado o no disponible" });
    }

    const currency = "USD";
    const productResponse: ProductResponse = {
      ...product,
      price_formatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(product.price)),
    };

    res.status(200).json(productResponse);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Obtener productos por categoría
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID de categoría inválido o faltante" });
    }

    let products = await productsService.getProductsByCategory(categoryId);

    
    products = products.filter(
      (p) =>
        Number(p.is_active) === 1 &&
        Number(p.stock) > 0 &&
        p.image_url &&
        Number(p.is_discontinued) === 0
    );

    const currency = "USD";
    const productsResponse: ProductResponse[] = products.map((p) => ({
      ...p,
      price_formatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(p.price)),
    }));

    res.status(200).json(productsResponse);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
  //paginacion
  export const getProductCatalog = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const search = req.query.search ? String(req.query.search).trim() : undefined;
    console.log("BUSCANDO:", search);

    const { products, total } = await productsService.getFilteredProducts(page, limit, search);

    // Formatear precio
    const currency = "USD";
    const formatted = products.map((p) => ({
      ...p,
      price_formatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(p.price)),
    }));

    res.status(200).json({
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    
    console.error("Error al obtener catálogo:", error);
    res.status(500).json({ message: error.message || "Error al obtener productos" });
    }
};

