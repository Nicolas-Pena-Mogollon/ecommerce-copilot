import { Product, ProductFilter } from '../models/product.model';
import { Observable } from 'rxjs';
import { InjectionToken } from '@angular/core';

export interface ProductRepositoryPort {
  getAllProducts(): Observable<Product[]>;
  getProductsByFilter(filter: ProductFilter): Observable<Product[]>;
  getProductById(id: string): Observable<Product | null>;
  searchProducts(searchTerm: string): Observable<Product[]>;
}

// Token de inyección para el puerto del repositorio de productos
export const PRODUCT_REPOSITORY_PORT = new InjectionToken<ProductRepositoryPort>('ProductRepositoryPort'); 