import { Injectable, Inject } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Product, ProductFilter } from '../../domain/models/product.model';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product.repository.port';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private filterSubject = new BehaviorSubject<ProductFilter>({});

  public products$ = this.productsSubject.asObservable();
  public filteredProducts$ = combineLatest([
    this.products$,
    this.filterSubject
  ]).pipe(
    map(([products, filter]) => this.applyFilter(products, filter))
  );

  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private productRepository: ProductRepositoryPort) {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productRepository.getAllProducts().subscribe({
      next: (products) => this.productsSubject.next(products),
      error: (error) => console.error('Error loading products:', error)
    });
  }

  public searchProducts(searchTerm: string): void {
    this.filterSubject.next({ ...this.filterSubject.value, searchTerm });
  }

  public filterByCategory(category: string | null): void {
    const currentFilter = this.filterSubject.value;
    this.filterSubject.next({
      ...currentFilter,
      category: category as any || undefined
    });
  }

  public filterByPriceRange(minPrice?: number, maxPrice?: number): void {
    const currentFilter = this.filterSubject.value;
    this.filterSubject.next({
      ...currentFilter,
      minPrice,
      maxPrice
    });
  }

  public filterByDiscount(hasDiscount: boolean): void {
    const currentFilter = this.filterSubject.value;
    this.filterSubject.next({
      ...currentFilter,
      hasDiscount
    });
  }

  public filterByStock(inStock: boolean): void {
    const currentFilter = this.filterSubject.value;
    this.filterSubject.next({
      ...currentFilter,
      inStock
    });
  }

  public clearFilters(): void {
    this.filterSubject.next({});
  }

  public getProductById(id: string): Observable<Product | null> {
    return this.productRepository.getProductById(id);
  }

  private applyFilter(products: Product[], filter: ProductFilter): Product[] {
    return products.filter(product => {
      // Filtro por término de búsqueda
      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
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
      if (filter.category && product.category !== filter.category) {
        return false;
      }

      // Filtro por rango de precio
      if (filter.minPrice && product.price < filter.minPrice) {
        return false;
      }
      if (filter.maxPrice && product.price > filter.maxPrice) {
        return false;
      }

      // Filtro por descuento
      if (filter.hasDiscount && !product.discount) {
        return false;
      }

      // Filtro por stock
      if (filter.inStock && product.stock <= 0) {
        return false;
      }

      return true;
    });
  }
} 