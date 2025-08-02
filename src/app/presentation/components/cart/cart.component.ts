import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CART_SERVICE_PORT } from '../../../domain/ports/cart.service.port';
import { Cart } from '../../../domain/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart-container">
      <h2>Carrito de Compras</h2>
      
      <div class="cart-content" *ngIf="cart$ | async as cart">
        <div class="cart-items" *ngIf="cart.items.length > 0; else emptyCart">
          <div class="cart-item" *ngFor="let item of cart.items">
            <div class="item-image">
              <img [src]="item.product.imageUrl" [alt]="item.product.name" />
            </div>
            
            <div class="item-details">
              <h3>{{ item.product.name }}</h3>
              <p class="item-price">{{ formatPrice(item.product.price) }}</p>
            </div>
            
            <div class="item-quantity">
              <button 
                class="quantity-btn" 
                (click)="updateQuantity(item.productId, item.quantity - 1)"
                [disabled]="item.quantity <= 1">
                -
              </button>
              <span class="quantity">{{ item.quantity }}</span>
              <button 
                class="quantity-btn" 
                (click)="updateQuantity(item.productId, item.quantity + 1)"
                [disabled]="item.quantity >= item.product.stock">
                +
              </button>
            </div>
            
            <div class="item-total">
              {{ formatPrice(item.product.price * item.quantity) }}
            </div>
            
            <button 
              class="remove-btn" 
              (click)="removeFromCart(item.productId)">
              ✕
            </button>
          </div>
        </div>
        
        <ng-template #emptyCart>
          <div class="empty-cart">
            <p>Tu carrito está vacío</p>
            <p>¡Agrega algunos productos para comenzar!</p>
          </div>
        </ng-template>
        
        <div class="cart-summary" *ngIf="cart.items.length > 0">
          <div class="summary-row">
            <span>Total de productos:</span>
            <span>{{ cart.totalItems }}</span>
          </div>
          <div class="summary-row total">
            <span>Total a pagar:</span>
            <span>{{ formatPrice(cart.totalPrice) }}</span>
          </div>
          <button class="checkout-btn" (click)="checkout()">
            Proceder al Pago
          </button>
          <button class="clear-cart-btn" (click)="clearCart()">
            Vaciar Carrito
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  private cartService = inject(CART_SERVICE_PORT);
  
  cart$ = this.cartService.getCart();

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeFromCart(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  checkout(): void {
    alert('¡Funcionalidad de pago en desarrollo!');
  }
} 