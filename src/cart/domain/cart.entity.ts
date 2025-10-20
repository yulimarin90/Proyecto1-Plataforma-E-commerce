// Representa cada producto dentro del carrito
export interface CartItem {
  product_id: number;
  name?: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: Date;
  updated_at: Date;
}


// Para cuando se crea un nuevo carrito
export interface NewCart {
  user_id: number;
  items: CartItem[];
  total_amount?: number;
  created_at?: Date;
  updated_at?: Date;
  expires_at?: Date;
  status?: "active" | "expired" | "completed";
}

// Para carritos existentes
export interface Cart extends NewCart {
  id: number;
}
