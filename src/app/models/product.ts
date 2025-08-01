// src/app/models/product.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string; // asegúrate de usar "imageUrl" (no "image")
}
