import { Component, OnInit, inject, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductCategory } from '../../../domain/models/product.model';
import { ProductService } from '../../../application/services/product.service';
import { CartServicePort, CART_SERVICE_PORT } from '../../../domain/ports/cart.service.port';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductFilterComponent } from '../product-filter/product-filter.component';
import { UiContextService } from '../../../application/services/ui-context.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    ProductFilterComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CART_SERVICE_PORT);
  private uiContextService = inject(UiContextService);
  private searchSubscription?: Subscription;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories = Object.values(ProductCategory);
  selectedCategory: string | null = null;
  searchTerm: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  hasDiscount: boolean = false;
  inStock: boolean = false;
  loading: boolean = true;
  isSearching: boolean = false;

  ngOnInit(): void {
    this.loadProducts();
    this.setupSearchListener();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private setupSearchListener(): void {
    // Escuchar cambios en el término de búsqueda directamente
    this.searchSubscription = this.uiContextService.getSearchTerm$().subscribe(searchTerm => {
      if (searchTerm !== this.searchTerm) {
        this.searchTerm = searchTerm;
        this.isSearching = true;
        
        // Simular un pequeño delay para mostrar el indicador de búsqueda
        setTimeout(() => {
          this.productService.searchProducts(this.searchTerm);
          this.isSearching = false;
          console.log('Búsqueda en tiempo real aplicada:', this.searchTerm);
        }, 100);
      }
    });
  }

  private loadProducts(): void {
    this.productService.filteredProducts$.subscribe({
      next: (products) => {
        this.filteredProducts = products;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.productService.searchProducts(searchTerm);
  }

  onCategoryFilter(category: string | null): void {
    this.selectedCategory = category;
    this.productService.filterByCategory(category);
  }

  onPriceRangeFilter(minPrice: number | null, maxPrice: number | null): void {
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
    this.productService.filterByPriceRange(minPrice || undefined, maxPrice || undefined);
  }

  onDiscountFilter(hasDiscount: boolean): void {
    this.hasDiscount = hasDiscount;
    this.productService.filterByDiscount(hasDiscount);
  }

  onStockFilter(inStock: boolean): void {
    this.inStock = inStock;
    this.productService.filterByStock(inStock);
  }

  onClearFilters(): void {
    this.selectedCategory = null;
    this.searchTerm = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.hasDiscount = false;
    this.inStock = false;
    this.productService.clearFilters();
  }

  onAddToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.productService.searchProducts('');
    this.uiContextService.updateSearchTerm('');
  }
} 