// src/checkout/checkout.entity.ts
export interface Checkout {
  id?: number;
  cartId: string;
  paymentMethod: string;
  shippingAddress: string;
  createdAt?: Date;
  status?: string;
}

export interface Order {
  id?: number;
  userId: number;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
  status?: string;
  createdAt?: Date;
}

export interface OrderProduct {
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
}
