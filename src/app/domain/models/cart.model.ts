export interface CartItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
} 