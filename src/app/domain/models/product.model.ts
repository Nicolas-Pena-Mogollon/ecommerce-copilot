export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

export enum ProductCategory {
  ROPA = 'ropa',
  ELECTRODOMESTICOS = 'electrodomesticos',
  COMIDA = 'comida',
  TECNOLOGIA = 'tecnologia',
  HOGAR = 'hogar',
  DEPORTES = 'deportes',
  LIBROS = 'libros',
  JUGUETES = 'juguetes'
}

export interface ProductFilter {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
  inStock?: boolean;
  searchTerm?: string;
} 