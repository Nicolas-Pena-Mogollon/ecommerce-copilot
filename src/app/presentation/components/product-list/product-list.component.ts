import { Component, OnInit, inject, Inject, OnDestroy, AfterViewInit, ElementRef, HostListener } from '@angular/core';
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
export class ProductListComponent implements OnInit, OnDestroy, AfterViewInit {
  private productService = inject(ProductService);
  private cartService = inject(CART_SERVICE_PORT);
  private uiContextService = inject(UiContextService);
  private searchSubscription?: Subscription;
  private elementRef = inject(ElementRef);
  private navbarHeight = 80; // Altura del navbar
  private lastScrollTop = 0;
  private navbarVisible = true;

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

  ngAfterViewInit(): void {
    this.setupNavbarDetection();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.detectNavbarVisibility();
  }

  private setupNavbarDetection(): void {
    // Detectar la visibilidad inicial del navbar
    this.detectNavbarVisibility();
  }

  private detectNavbarVisibility(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const navbar = document.querySelector('.navbar') as HTMLElement;
    
    if (navbar) {
      const navbarRect = navbar.getBoundingClientRect();
      const isNavbarVisible = navbarRect.top >= 0;
      
      if (isNavbarVisible !== this.navbarVisible) {
        this.navbarVisible = isNavbarVisible;
        this.adjustFiltersPosition();
      }
    }
    
    this.lastScrollTop = scrollTop;
  }

  private adjustFiltersPosition(): void {
    const filtersSidebar = this.elementRef.nativeElement.querySelector('.filters-sidebar') as HTMLElement;
    
    if (filtersSidebar) {
      if (this.navbarVisible) {
        // Navbar visible - posición normal
        filtersSidebar.style.top = '100px';
        filtersSidebar.style.maxHeight = 'calc(100vh - 120px)';
      } else {
        // Navbar oculto - subir los filtros
        filtersSidebar.style.top = '20px';
        filtersSidebar.style.maxHeight = 'calc(100vh - 40px)';
      }
    }
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