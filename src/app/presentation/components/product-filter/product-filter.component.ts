import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCategory, ProductFilter } from '../../../domain/models/product.model';
import { UiContextService } from '../../../application/services/ui-context.service';

@Component({
  selector: 'app-product-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-panel" data-filter-panel="main" data-component="filters">
      <h3>Filtros</h3>
      
      <!-- Filtro por categoría -->
      <div class="filter-section" data-filter-section="category" data-component="category-filter">
        <label>Categoría:</label>
        <select 
          [(ngModel)]="selectedCategory" 
          (change)="onCategoryChange()"
          data-filter="category-select"
          data-filter-type="category"
          data-component="category-select"
          [attr.data-selected-category]="selectedCategory"
        >
          <option [value]="null">Todas las categorías</option>
          <option *ngFor="let category of categories" [value]="category">
            {{ getCategoryDisplayName(category) }}
          </option>
        </select>
      </div>

      <!-- Filtro por rango de precio -->
      <div class="filter-section" data-filter-section="price" data-component="price-filter">
        <label>Rango de Precio:</label>
        <div class="price-inputs">
          <input 
            type="number" 
            placeholder="Mín" 
            [(ngModel)]="minPrice"
            (input)="onPriceRangeChange()"
            data-filter="price-min"
            data-filter-type="price"
            data-component="price-min-input"
            [attr.data-min-price]="minPrice"
          />
          <input 
            type="number" 
            placeholder="Máx" 
            [(ngModel)]="maxPrice"
            (input)="onPriceRangeChange()"
            data-filter="price-max"
            data-filter-type="price"
            data-component="price-max-input"
            [attr.data-max-price]="maxPrice"
          />
        </div>
      </div>

      <!-- Filtro por descuento -->
      <div class="filter-section" data-filter-section="discount" data-component="discount-filter">
        <label>
          <input 
            type="checkbox" 
            [(ngModel)]="hasDiscount"
            (change)="onDiscountChange()"
            data-filter="discount-checkbox"
            data-filter-type="discount"
            data-component="discount-checkbox"
            [attr.data-has-discount]="hasDiscount"
          />
          Solo productos con descuento
        </label>
      </div>

      <!-- Filtro por stock -->
      <div class="filter-section" data-filter-section="stock" data-component="stock-filter">
        <label>
          <input 
            type="checkbox" 
            [(ngModel)]="inStock"
            (change)="onStockChange()"
            data-filter="stock-checkbox"
            data-filter-type="stock"
            data-component="stock-checkbox"
            [attr.data-in-stock]="inStock"
          />
          Solo productos en stock
        </label>
      </div>

      <!-- Botón limpiar filtros -->
      <button 
        class="clear-filters-btn" 
        (click)="clearFilters()"
        data-action="clear-filters"
        data-component="clear-filters-button"
        [attr.data-filters-active]="isAnyFilterActive()"
      >
        Limpiar Filtros
      </button>
    </div>
  `,
  styleUrls: ['./product-filter.component.scss']
})
export class ProductFilterComponent {
  @Output() categoryFilter = new EventEmitter<string | null>();
  @Output() priceRangeFilter = new EventEmitter<{minPrice: number | null, maxPrice: number | null}>();
  @Output() discountFilter = new EventEmitter<boolean>();
  @Output() stockFilter = new EventEmitter<boolean>();
  @Output() clearFiltersEvent = new EventEmitter<void>();

  private uiContextService = inject(UiContextService);

  categories = Object.values(ProductCategory);
  selectedCategory: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  hasDiscount: boolean = false;
  inStock: boolean = false;

  onCategoryChange(): void {
    this.categoryFilter.emit(this.selectedCategory);
    this.updateContextFilters();
  }

  onPriceRangeChange(): void {
    this.priceRangeFilter.emit({
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    });
    this.updateContextFilters();
  }

  onDiscountChange(): void {
    this.discountFilter.emit(this.hasDiscount);
    this.updateContextFilters();
  }

  onStockChange(): void {
    this.stockFilter.emit(this.inStock);
    this.updateContextFilters();
  }

  clearFilters(): void {
    this.selectedCategory = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.hasDiscount = false;
    this.inStock = false;
    
    this.clearFiltersEvent.emit();
    this.updateContextFilters();
  }

  private updateContextFilters(): void {
    const currentFilters: ProductFilter = {
      searchTerm: '',
      category: this.selectedCategory as ProductCategory || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
      hasDiscount: this.hasDiscount,
      inStock: this.inStock
    };

    this.uiContextService.updateCurrentFilters(currentFilters);
  }

  isAnyFilterActive(): boolean {
    return !!(
      this.selectedCategory ||
      this.minPrice ||
      this.maxPrice ||
      this.hasDiscount ||
      this.inStock
    );
  }

  private getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedCategory) count++;
    if (this.minPrice || this.maxPrice) count++;
    if (this.hasDiscount) count++;
    if (this.inStock) count++;
    return count;
  }

  getCategoryDisplayName(category: string): string {
    const displayNames: { [key: string]: string } = {
      'ropa': 'Ropa',
      'electrodomesticos': 'Electrodomésticos',
      'comida': 'Comida',
      'tecnologia': 'Tecnología',
      'hogar': 'Hogar',
      'deportes': 'Deportes',
      'libros': 'Libros',
      'juguetes': 'Juguetes'
    };
    return displayNames[category] || category;
  }
} 