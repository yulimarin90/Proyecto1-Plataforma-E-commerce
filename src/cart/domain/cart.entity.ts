export interface CartItem {
  productId: string;
  quantity: number;
}

export class Cart {
  constructor(
    public userId: string,
    public items: CartItem[] = []
  ) {}

  addItem(productId: string, quantity: number) {
    const existing = this.items.find(i => i.productId === productId);
    if (existing) existing.quantity += quantity;
    else this.items.push({ productId, quantity });
  }

  updateQuantity(productId: string, quantity: number) {
    const item = this.items.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }

  removeItem(productId: string) {
    this.items = this.items.filter(i => i.productId !== productId);
  }

  clear() {
    this.items = [];
  }
}
