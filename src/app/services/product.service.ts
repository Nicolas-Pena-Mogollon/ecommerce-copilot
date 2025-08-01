import { Injectable } from '@angular/core';
import { PRODUCTS } from '../data/products';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  getVisibleProducts(): Product[] {
    return PRODUCTS;
  }
}
