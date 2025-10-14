// src/checkout/infraestructure/repositories/checkout.repository.ts
import db from "../../../config/db";

export interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
}

export class CheckoutRepository {

  async getProductById(productId: number): Promise<Product | null> {
    try {
      const [rows]: any = await db.query(
        `SELECT id, name, stock, price FROM products WHERE id = ?`,
        [productId]
      );
      return rows[0] || null;
    } catch (err) {
      throw { status: 500, message: "Error al consultar producto", detail: err };
    }
  }


  async reduceStock(productId: number, quantity: number) {
    await db.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [
      quantity,
      productId,
    ]);
  }
}
