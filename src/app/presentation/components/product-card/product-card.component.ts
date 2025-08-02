import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../domain/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="product-card" 
      [class.out-of-stock]="!product.isAvailable"
      [attr.data-product-id]="product.id"
      [attr.data-product-name]="product.name"
      [attr.data-product-category]="product.category"
      [attr.data-product-price]="product.price"
      [attr.data-product-original-price]="product.originalPrice"
      [attr.data-product-discount]="product.discount"
      [attr.data-product-stock]="product.stock"
      [attr.data-product-index]="productIndex"
      [attr.data-product-available]="product.isAvailable"
    >
      <div class="product-image">
        <img [src]="product.imageUrl" [alt]="product.name" />
        <div class="discount-badge" *ngIf="product.discount">
          -{{ product.discount }}%
        </div>
      </div>
      
      <div class="product-info">
        <h3 class="product-name">{{ product.name }}</h3>
        <p class="product-category">{{ product.category }}</p>
        <p class="product-description">{{ product.description }}</p>
        
        <div class="price-section">
          <span class="current-price">{{ formatPrice(product.price) }}</span>
          <span class="original-price" *ngIf="product.originalPrice">
            {{ formatPrice(product.originalPrice) }}
          </span>
        </div>
        
        <div class="stock-info">
          <span class="stock-text" [class.low-stock]="product.stock <= 10">
            Stock: {{ product.stock }} unidades
          </span>
        </div>
        
        <button 
          class="add-to-cart-btn" 
          (click)="addToCart()"
          [disabled]="!product.isAvailable || product.stock <= 0"
          [attr.data-product-id]="product.id"
          [attr.data-product-name]="product.name"
          [attr.data-product-price]="product.price"
          [attr.data-action]="'add-to-cart'"
          [attr.data-button-type]="'product-action'"
        >
          {{ product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock' }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() productIndex?: number; // Nuevo input para el índice
  @Output() addToCartEvent = new EventEmitter<Product>();

  addToCart(): void {
    if (this.product.isAvailable && this.product.stock > 0) {
      this.addToCartEvent.emit(this.product);
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
} 