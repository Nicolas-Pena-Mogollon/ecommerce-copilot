import { Injectable, Inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { filter, debounceTime } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { CART_SERVICE_PORT, CartServicePort } from '../../domain/ports/cart.service.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { Product, ProductFilter, ProductCategory } from '../../domain/models/product.model';

// Interfaces para tipado fuerte
export interface UiContext {
  view: string;
  cartItems: ProductSummary[];
  visibleProducts: ProductSummary[];
  currentFilters: ProductFilter;
  searchTerm?: string;
  pageHtml: string;
  userInput?: string;
  timestamp?: Date;
  // Targets clave disponibles para popups
  availableTargets: {
    products: string[];
    navigation: string[];
    filters: string[];
  };
}

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface ViewContext {
  name: string;
  params?: Record<string, any>;
  queryParams?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class UiContextService {
  private readonly _currentView$ = new BehaviorSubject<ViewContext>({ name: 'home' });
  private readonly _userInput$ = new BehaviorSubject<string>('');
  private readonly _searchTerm$ = new BehaviorSubject<string>('');
  private currentFilters: ProductFilter = {};

  constructor(
    @Inject(CART_SERVICE_PORT) private cartService: CartServicePort,
    @Inject(PRODUCT_REPOSITORY_PORT) private productRepository: ProductRepositoryPort,
    private router: Router
  ) {
    this.initializeRouterListener();
  }

  /**
   * Actualiza los filtros actuales
   */
  updateCurrentFilters(filters: ProductFilter): void {
    this.currentFilters = filters;
  }

  /**
   * Actualiza el término de búsqueda
   */
  updateSearchTerm(searchTerm: string): void {
    this.currentFilters = {
      ...this.currentFilters,
      searchTerm: searchTerm || undefined
    };
    this._searchTerm$.next(searchTerm);
  }

  /**
   * Obtiene los filtros actuales
   */
  getCurrentFilters(): ProductFilter {
    return this.currentFilters;
  }

  /**
   * Obtiene la vista actual como Observable
   */
  getCurrentView$(): Observable<ViewContext> {
    return this._currentView$.asObservable();
  }

  /**
   * Obtiene el término de búsqueda como Observable
   */
  getSearchTerm$(): Observable<string> {
    return this._searchTerm$.asObservable().pipe(
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged() // Solo emitir si el valor realmente cambió
    );
  }

  /**
   * Obtiene información estructurada de la página actual
   */
  private getPageStructureInfo(): string {
    try {
      const info: any = {
        title: document.title,
        url: window.location.href,
        elements: {
          products: document.querySelectorAll('.product-card, .product-item').length,
          filters: document.querySelectorAll('.filter-panel, .filter-section').length,
          cart: document.querySelectorAll('.cart, .cart-item').length,
          navigation: document.querySelectorAll('nav, .navbar').length,
          searchBar: document.querySelectorAll('.search-bar, .search-input, input[type="search"]').length
        },
        textContent: {
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 10),
          links: Array.from(document.querySelectorAll('a')).map(a => a.textContent?.trim()).filter(Boolean).slice(0, 10)
        }
      };
      
      return JSON.stringify(info, null, 2);
    } catch (error) {
      console.error('Error getting page structure:', error);
      return 'Error getting page structure: ' + (error as Error).message;
    }
  }

  /**
   * Obtiene el HTML de la página actual
   */
  private getCurrentPageHtml(): string {
    try {
      console.log('Getting page HTML...');
      
      // Intentar obtener el HTML del contenido principal de la aplicación
      const appRoot = document.querySelector('app-root');
      if (appRoot) {
        console.log('Found app-root element');
        const appHtml = appRoot.innerHTML;
        console.log('App HTML length:', appHtml.length);
        
        if (appHtml.length > 0) {
          // Limpiar el HTML
          let cleanHtml = appHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log('Clean app HTML length:', cleanHtml.length);
          console.log('Clean app HTML preview:', cleanHtml.substring(0, 500) + '...');
          
          return cleanHtml;
        }
      }
      
      // Fallback: obtener el HTML del body
      const bodyHtml = document.body.innerHTML;
      console.log('Fallback: Raw body HTML length:', bodyHtml.length);
      
      if (bodyHtml.length === 0) {
        console.warn('Body HTML is empty!');
        return 'Body HTML is empty';
      }
      
      // Para simplificar, solo remover scripts y estilos básicos
      let cleanHtml = bodyHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remover estilos
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
      
      console.log('Clean body HTML length:', cleanHtml.length);
      console.log('Clean body HTML preview:', cleanHtml.substring(0, 500) + '...');
      
      return cleanHtml;
    } catch (error) {
      console.error('Error getting page HTML:', error);
      return 'Error getting page HTML: ' + (error as Error).message;
    }
  }

  /**
   * Obtiene el contexto de UI con datos completos (Promise)
   */
  async getUiContextWithData(userInput?: string): Promise<UiContext> {
    try {
      // Obtener datos actuales
      const cart = await firstValueFrom(this.cartService.getCart());
      const cartItems = cart?.items || [];
      
      // Obtener productos FILTRADOS (los que realmente están visibles)
      const allProducts = await firstValueFrom(this.productRepository.getAllProducts());
      const filteredProducts = this.applyCurrentFilters(allProducts);
      
      // Obtener HTML de la página actual
      const pageHtml = this.getCurrentPageHtml();
      
      // Construir el contexto
      const context: UiContext = {
        view: this.getCurrentView().name,
        cartItems: cartItems.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          originalPrice: item.product.originalPrice,
          discount: item.product.discount,
          stock: item.product.stock,
          description: item.product.description,
          imageUrl: item.product.imageUrl,
          isAvailable: item.product.isAvailable
        })),
        visibleProducts: filteredProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          stock: product.stock,
          description: product.description,
          imageUrl: product.imageUrl,
          isAvailable: product.isAvailable
        })),
        currentFilters: {
          ...this.currentFilters,
          // Información adicional sobre el estado de filtros
          totalProducts: allProducts.length,
          filteredProductsCount: filteredProducts.length,
          isFiltered: this.isAnyFilterActive(),
          activeFiltersCount: this.getActiveFiltersCount()
        } as any,
        searchTerm: this._searchTerm$.value, // Agregar el término de búsqueda actual
        pageHtml: pageHtml,
        timestamp: new Date(),
        // Targets clave disponibles para popups
        availableTargets: {
          products: ['product', 'product_button'],
          navigation: ['search', 'search_button', 'clear_search', 'cart', 'home'],
          filters: ['filter_panel', 'category_filter', 'price_filter', 'discount_filter', 'stock_filter', 'clear_filters']
        }
      };

      return context;
    } catch (error) {
      console.error('Error getting UI context with data:', error);
      throw error;
    }
  }

  /**
   * Aplica los filtros actuales a la lista de productos
   */
  private applyCurrentFilters(products: any[]): any[] {
    return products.filter(product => {
      // Filtro por término de búsqueda
      if (this.currentFilters.searchTerm) {
        const searchTerm = this.currentFilters.searchTerm.toLowerCase();
        const productName = product.name.toLowerCase();
        const productDescription = product.description.toLowerCase();
        const productCategory = product.category.toLowerCase();
        
        if (!productName.includes(searchTerm) && 
            !productDescription.includes(searchTerm) && 
            !productCategory.includes(searchTerm)) {
          return false;
        }
      }

      // Filtro por categoría
      if (this.currentFilters.category && product.category !== this.currentFilters.category) {
        return false;
      }

      // Filtro por rango de precio
      if (this.currentFilters.minPrice && product.price < this.currentFilters.minPrice) {
        return false;
      }
      if (this.currentFilters.maxPrice && product.price > this.currentFilters.maxPrice) {
        return false;
      }

      // Filtro por descuento
      if (this.currentFilters.hasDiscount && !product.discount) {
        return false;
      }

      // Filtro por stock
      if (this.currentFilters.inStock && product.stock <= 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Verifica si hay algún filtro activo
   */
  private isAnyFilterActive(): boolean {
    return !!(
      this.currentFilters.searchTerm ||
      this.currentFilters.category ||
      this.currentFilters.minPrice ||
      this.currentFilters.maxPrice ||
      this.currentFilters.hasDiscount ||
      this.currentFilters.inStock
    );
  }

  /**
   * Cuenta cuántos filtros están activos
   */
  private getActiveFiltersCount(): number {
    let count = 0;
    if (this.currentFilters.searchTerm) count++;
    if (this.currentFilters.category) count++;
    if (this.currentFilters.minPrice) count++;
    if (this.currentFilters.maxPrice) count++;
    if (this.currentFilters.hasDiscount) count++;
    if (this.currentFilters.inStock) count++;
    return count;
  }

  /**
   * Obtiene la vista actual como valor síncrono
   */
  getCurrentView(): ViewContext {
    return this._currentView$.value;
  }

  private initializeRouterListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      const viewContext = this.parseUrlToViewContext(url);
      this._currentView$.next(viewContext);
    });
  }

  private parseUrlToViewContext(url: string): ViewContext {
    const urlParts = url.split('?');
    const path = urlParts[0];
    const queryString = urlParts[1] || '';

    // Mapeo de rutas a nombres de vista más legibles
    const viewMapping: Record<string, string> = {
      '/': 'home',
      '/catalog': 'catalog',
      '/products': 'product-list',
      '/cart': 'shopping-cart',
      '/checkout': 'checkout',
      '/profile': 'user-profile',
      '/orders': 'order-history'
    };

    const viewName = viewMapping[path] || this.extractViewNameFromPath(path);
    
    // Parsear query parameters
    const queryParams = this.parseQueryString(queryString);

    return {
      name: viewName,
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
    };
  }

  private extractViewNameFromPath(path: string): string {
    // Extraer el nombre de la vista de la ruta
    const segments = path.split('/').filter(segment => segment.length > 0);
    return segments[0] || 'unknown';
  }

  private parseQueryString(queryString: string): Record<string, any> {
    if (!queryString) return {};
    
    return queryString.split('&').reduce((params, param) => {
      const [key, value] = param.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
      return params;
    }, {} as Record<string, any>);
  }
} 