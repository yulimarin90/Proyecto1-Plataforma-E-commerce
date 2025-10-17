import { Request, Response } from "express";
import { CartService } from "../../application/cart.service";
import { ProductsRepository } from "../../../Products/infraestructure/repositories/products.repository";
import { CartRepository } from "../repositories/cart.repository.msql";

// Instancias por defecto (se pueden inyectar en tests)
let productRepository = new ProductsRepository();
let repository = new CartRepository(productRepository);
let cartService = new CartService(repository);

// Setters para pruebas: permiten inyectar mocks desde los tests de integración
export const setCartService = (svc: any) => {
  cartService = svc;
};
export const setProductsRepository = (repo: any) => {
  productRepository = repo;
};

export class CartController {
  async viewCart(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      // Validar que haya un userId válido
      if (isNaN(userId)) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const cart = await cartService.getCart(userId);
      res.status(200).json(cart);
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  }

  async addItem(req: Request, res: Response) {
    try {
         const userId = Number(req.body.user_id || req.params.user_id);
      const { productId, cantidad } = req.body;

      // Validar datos de entrada
      if (!productId || !cantidad) {
        return res.status(400).json({ error: "productId y cantidad son requeridos" });
      }

  const product = await productRepository.findById(Number(productId));
      if (!product || !product.id) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (cantidad > product.stock) {
        return res.status(400).json({ error: "Cantidad supera el stock disponible" });
      }

      // Construimos el objeto con números seguros
      const productData = {
        product_id: Number(product.id),
        name: product.name,
        quantity: Number(cantidad),
        price: Number(product.price),
        stock_available: Number(product.stock),
      };

      // Log para depurar
      console.log("productData a insertar:", productData);

      // Validación extra para evitar NaN
      if (
        isNaN(productData.product_id) ||
        isNaN(productData.quantity) ||
        isNaN(productData.price) ||
        isNaN(productData.stock_available)
      ) {
        console.error("Datos inválidos detectados en productData");
        return res.status(400).json({
          error: "Datos inválidos en el producto. Revisa los valores enviados o en la BD.",
        });
      }

  const cart = await cartService.addItem(userId, productData);
      res.status(201).json({ message: "Producto agregado", cart });

    } catch (e: any) {
      console.error("Error en addItem:", e);
      res.status(400).json({ error: e.message });
    }
  }

  async updateQuantity(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      const { item_id } = req.params;
      const { quantity } = req.body;

      const product = await productRepository.findById(Number(item_id));
      if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  const cart = await cartService.updateQuantity(
        userId,
        Number(item_id),
        quantity,
        product.stock
      );

      res.status(200).json({ message: "Cantidad actualizada", cart });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async removeItem(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      // Validar user
      if (isNaN(userId)) return res.status(401).json({ error: 'Usuario no autenticado' });

      // Aceptar productId desde params o body
      const productIdParam = req.params.productId;
      const productIdBody = (req.body && req.body.productId) ? req.body.productId : undefined;
      const productId = Number(productIdParam ?? productIdBody);

      if (isNaN(productId)) return res.status(400).json({ error: 'productId es requerido' });

      const cart = await cartService.removeItem(userId, productId);
      res.status(200).json({ message: "Ítem eliminado", cart });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async clearCart(req: Request, res: Response) {
    try {
      const userId = Number(req.headers["x-user-id"]);
      if (isNaN(userId)) return res.status(401).json({ error: 'Usuario no autenticado' });

      await cartService.clearCart(userId);
      res.status(204).send();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
