import { Cart, CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { Observable } from 'rxjs';
import { InjectionToken } from '@angular/core';

export interface CartServicePort {
  getCart(): Observable<Cart>;
  addToCart(product: Product, quantity?: number): void;
  removeFromCart(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clearCart(): void;
  getCartItemCount(): Observable<number>;
}

// Token de inyección para el puerto del servicio del carrito
export const CART_SERVICE_PORT = new InjectionToken<CartServicePort>('CartServicePort'); 