// src/app/data/products.ts
import { Product } from '../models/product';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Laptop X1 Carbon',
    description: 'Liviana, poderosa y profesional',
    price: 1200000,
    imageUrl: 'assets/laptop1.jpg',
  },
  {
    id: 2,
    name: 'Mouse inalámbrico MX Master',
    description: 'Ergonómico y preciso',
    price: 220000,
    imageUrl: 'assets/mouse.jpg',
  },
  {
    id: 3,
    name: 'Monitor UltraWide 34”',
    description: 'Productividad al siguiente nivel',
    price: 1800000,
    imageUrl: 'assets/monitor.jpg',
  },
];
