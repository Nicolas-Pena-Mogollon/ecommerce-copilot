import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CART_SERVICE_PORT } from '../../../domain/ports/cart.service.port';
import { UiContextService } from '../../../application/services/ui-context.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <nav class="navbar" data-navbar="main" data-component="navigation">
      <div class="navbar-container">
        <div class="navbar-brand">
          <a 
            routerLink="/" 
            class="brand-link" 
            data-nav="brand"
            data-action="navigate-home"
            data-component="brand"
          >
            <span class="brand-icon">🛒</span>
            IndraShop
          </a>
        </div>
        
        <div class="navbar-search" data-nav="search" data-component="search">
          <div class="search-container" [class.active-search]="searchTerm.length > 0">
            <input 
              type="search" 
              placeholder="Buscar productos..." 
              class="search-input"
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              (keyup.enter)="performSearch()"
              data-input="search"
              data-action="search"
              data-component="search-input"
              [attr.data-search-term]="searchTerm"
            />
                         <div class="search-buttons">
               <button 
                 *ngIf="searchTerm.length > 0" 
                 class="clear-search-btn" 
                 (click)="clearSearch()"
                 title="Limpiar búsqueda"
                 data-action="clear-search"
                 data-component="clear-button"
               >
                 ✕
               </button>
             </div>
          </div>
        </div>
        
        <div class="navbar-actions" data-nav="menu" data-component="menu">
          <a 
            routerLink="/" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: true}" 
            class="nav-btn"
            data-nav="products"
            data-action="navigate-products"
            data-component="nav-link"
          >
            <span class="btn-icon">📦</span>
            Productos
          </a>
          <a 
            routerLink="/cart" 
            routerLinkActive="active" 
            class="nav-btn cart-btn"
            data-nav="cart"
            data-action="view-cart"
            data-component="cart-link"
            [attr.data-cart-count]="(cartItemCount$ | async)"
          >
            <span class="btn-icon">🛒</span>
            <span class="cart-count" *ngIf="(cartItemCount$ | async) as count; else noCount">
              {{ count }}
            </span>
            <ng-template #noCount></ng-template>
          </a>
        </div>
      </div>
    </nav>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private cartService = inject(CART_SERVICE_PORT);
  private uiContextService = inject(UiContextService);
  
  cartItemCount$ = this.cartService.getCartItemCount();
  searchTerm: string = '';

  onSearchChange(): void {
    // Actualizar el término de búsqueda en el contexto inmediatamente
    this.uiContextService.updateSearchTerm(this.searchTerm);
    console.log('Búsqueda en tiempo real:', this.searchTerm);
  }

  performSearch(): void {
    // La búsqueda ya se ejecuta en tiempo real, este método es solo para el botón
    console.log('Botón de búsqueda presionado:', this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.uiContextService.updateSearchTerm(this.searchTerm);
    console.log('Búsqueda limpiada');
  }
} 