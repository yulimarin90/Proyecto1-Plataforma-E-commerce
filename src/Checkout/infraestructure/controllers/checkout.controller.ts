// src/checkout/infraestructure/controllers/checkout.controller.ts
import { Request, Response } from "express";
import { CheckoutService } from "../../application/checkout.service";

let checkoutService = new CheckoutService();

// Setter para pruebas: permite inyectar un mock desde los tests de integración
export const setCheckoutService = (svc: any) => {
  checkoutService = svc;
};

export class CheckoutController {

  static async checkout(req: Request, res: Response) {
    try {
      const { userId, products, shipping_address, payment_method } = req.body;


      const checkoutData = {
        userId: userId || (req as any).user?.id,
        products,
        shipping_address,
        payment_method,
      };

      const result = await checkoutService.processCheckout(checkoutData);

      return res.status(200).json(result);
    } catch (err: any) {
      console.error("❌ Error en checkout:", err);

      // Si es un error personalizado con status
      if (err.status && err.message) {
        return res.status(err.status).json({ message: err.message });
      }

      // Error genérico
      return res.status(500).json({ message: "Error interno en el servidor" });
    }
  }
}
