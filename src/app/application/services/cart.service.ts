import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cart, CartItem } from '../../domain/models/cart.model';
import { Product } from '../../domain/models/product.model';
import { CartServicePort, CART_SERVICE_PORT } from '../../domain/ports/cart.service.port';

@Injectable({
  providedIn: 'root'
})
export class CartApplicationService implements CartServicePort {
  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });

  public cart$ = this.cartSubject.asObservable();
  public cartItemCount$ = this.cart$.pipe(
    map(cart => cart.totalItems)
  );

  constructor() {}

  public getCart(): Observable<Cart> {
    return this.cart$;
  }

  public addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.items.findIndex(item => item.productId === product.id);

    if (existingItemIndex >= 0) {
      // Actualizar cantidad si el producto ya existe
      const updatedItems = [...currentCart.items];
      updatedItems[existingItemIndex].quantity += quantity;
      
      this.updateCart(updatedItems);
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        productId: product.id,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock
        }
      };

      const updatedItems = [...currentCart.items, newItem];
      this.updateCart(updatedItems);
    }
  }

  public removeFromCart(productId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.filter(item => item.productId !== productId);
    this.updateCart(updatedItems);
  }

  public updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    this.updateCart(updatedItems);
  }

  public clearCart(): void {
    this.cartSubject.next({
      items: [],
      totalItems: 0,
      totalPrice: 0
    });
  }

  public getCartItemCount(): Observable<number> {
    return this.cartItemCount$;
  }

  private updateCart(items: CartItem[]): void {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    this.cartSubject.next({
      items,
      totalItems,
      totalPrice
    });
  }
} 