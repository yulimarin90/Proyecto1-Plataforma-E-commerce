import { Request, Response } from "express";
import { CheckoutService } from "../../application/checkout.service";

let checkoutService = new CheckoutService();
export const setCheckoutService = (svc: any) => (checkoutService = svc);

export class CheckoutController {
  static async checkout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const { products, shipping_address, payment_method } = req.body;

      const result = await checkoutService.processCheckout({
        userId,
        products,
        shipping_address,
        payment_method,
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.error("❌ Error en checkout:", err);
      return res.status(err.status || 500).json({ message: err.message || "Error interno" });
    }
  }
}
