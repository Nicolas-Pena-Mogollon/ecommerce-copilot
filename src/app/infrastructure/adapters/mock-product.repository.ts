import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product, ProductCategory } from '../../domain/models/product.model';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable({
  providedIn: 'root'
})
export class MockProductRepository implements ProductRepositoryPort {
  private readonly mockProducts: Product[] = [
    {
      id: '1',
      name: 'Camiseta Básica de Algodón',
      category: ProductCategory.ROPA,
      price: 109158,
      originalPrice: 151158,
      discount: 28,
      stock: 50,
      description: 'Camiseta cómoda de algodón 100% orgánico, perfecta para el día a día',
      imageUrl: 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Camiseta',
      isAvailable: true
    },
    {
      id: '2',
      name: 'Smartphone Galaxy S23',
      category: ProductCategory.TECNOLOGIA,
      price: 3779958,
      originalPrice: 4199958,
      discount: 10,
      stock: 15,
      description: 'El último smartphone con cámara profesional y batería de larga duración',
      imageUrl: 'https://via.placeholder.com/300x400/2ECC71/FFFFFF?text=Smartphone',
      isAvailable: true
    },
    {
      id: '3',
      name: 'Refrigerador Samsung 500L',
      category: ProductCategory.ELECTRODOMESTICOS,
      price: 5459958,
      stock: 8,
      description: 'Refrigerador moderno con tecnología No Frost y eficiencia energética A++',
      imageUrl: 'https://via.placeholder.com/300x400/9B59B6/FFFFFF?text=Refrigerador',
      isAvailable: true
    },
    {
      id: '4',
      name: 'Pizza Margherita Congelada',
      category: ProductCategory.COMIDA,
      price: 37758,
      originalPrice: 54558,
      discount: 31,
      stock: 100,
      description: 'Pizza italiana auténtica con mozzarella y tomate, lista para hornear',
      imageUrl: 'https://via.placeholder.com/300x400/E74C3C/FFFFFF?text=Pizza',
      isAvailable: true
    },
    {
      id: '5',
      name: 'Laptop Dell Inspiron 15',
      category: ProductCategory.TECNOLOGIA,
      price: 3149958,
      originalPrice: 3779958,
      discount: 17,
      stock: 12,
      description: 'Laptop potente para trabajo y gaming con procesador Intel i7',
      imageUrl: 'https://via.placeholder.com/300x400/34495E/FFFFFF?text=Laptop',
      isAvailable: true
    },
    {
      id: '6',
      name: 'Jeans Slim Fit Azules',
      category: ProductCategory.ROPA,
      price: 251958,
      stock: 30,
      description: 'Jeans modernos con corte slim fit, perfectos para cualquier ocasión',
      imageUrl: 'https://via.placeholder.com/300x400/3498DB/FFFFFF?text=Jeans',
      isAvailable: true
    },
    {
      id: '7',
      name: 'Lavadora LG 8kg',
      category: ProductCategory.ELECTRODOMESTICOS,
      price: 2519958,
      originalPrice: 2939958,
      discount: 14,
      stock: 5,
      description: 'Lavadora inteligente con múltiples programas y control digital',
      imageUrl: 'https://via.placeholder.com/300x400/95A5A6/FFFFFF?text=Lavadora',
      isAvailable: true
    },
    {
      id: '8',
      name: 'Café Colombiano Premium',
      category: ProductCategory.COMIDA,
      price: 67158,
      stock: 200,
      description: 'Café 100% arábica de las montañas de Colombia, tostado artesanalmente',
      imageUrl: 'https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Café',
      isAvailable: true
    },
    {
      id: '9',
      name: 'Auriculares Sony WH-1000XM4',
      category: ProductCategory.TECNOLOGIA,
      price: 1469958,
      originalPrice: 1679958,
      discount: 13,
      stock: 25,
      description: 'Auriculares inalámbricos con cancelación de ruido activa',
      imageUrl: 'https://via.placeholder.com/300x400/2C3E50/FFFFFF?text=Auriculares',
      isAvailable: true
    },
    {
      id: '10',
      name: 'Vestido Elegante Negro',
      category: ProductCategory.ROPA,
      price: 377958,
      originalPrice: 545958,
      discount: 31,
      stock: 18,
      description: 'Vestido elegante para ocasiones especiales, confeccionado en seda natural',
      imageUrl: 'https://via.placeholder.com/300x400/1A1A1A/FFFFFF?text=Vestido',
      isAvailable: true
    },
    {
      id: '11',
      name: 'Microondas Panasonic',
      category: ProductCategory.ELECTRODOMESTICOS,
      price: 545958,
      stock: 20,
      description: 'Microondas con grill y múltiples funciones de cocción',
      imageUrl: 'https://via.placeholder.com/300x400/7F8C8D/FFFFFF?text=Microondas',
      isAvailable: true
    },
    {
      id: '12',
      name: 'Chocolate Artesanal 70% Cacao',
      category: ProductCategory.COMIDA,
      price: 54558,
      originalPrice: 71358,
      discount: 24,
      stock: 150,
      description: 'Chocolate premium con 70% de cacao, sin azúcares añadidos',
      imageUrl: 'https://via.placeholder.com/300x400/5D4037/FFFFFF?text=Chocolate',
      isAvailable: true
    },
    {
      id: '13',
      name: 'Tablet iPad Air',
      category: ProductCategory.TECNOLOGIA,
      price: 2729958,
      stock: 10,
      description: 'Tablet versátil con pantalla Retina y chip M1 para máximo rendimiento',
      imageUrl: 'https://via.placeholder.com/300x400/BDC3C7/FFFFFF?text=Tablet',
      isAvailable: true
    },
    {
      id: '14',
      name: 'Zapatillas Nike Air Max',
      category: ProductCategory.DEPORTES,
      price: 545958,
      originalPrice: 671958,
      discount: 19,
      stock: 35,
      description: 'Zapatillas deportivas con tecnología Air Max para máximo confort',
      imageUrl: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Zapatillas',
      isAvailable: true
    },
    {
      id: '15',
      name: 'Sofá 3 Plazas Moderno',
      category: ProductCategory.HOGAR,
      price: 3779958,
      originalPrice: 5039958,
      discount: 25,
      stock: 3,
      description: 'Sofá moderno con diseño minimalista y tapizado de alta calidad',
      imageUrl: 'https://via.placeholder.com/300x400/D35400/FFFFFF?text=Sofá',
      isAvailable: true
    },
    {
      id: '16',
      name: 'Libro "El Señor de los Anillos"',
      category: ProductCategory.LIBROS,
      price: 104958,
      stock: 45,
      description: 'Edición especial de la trilogía completa de Tolkien',
      imageUrl: 'https://via.placeholder.com/300x400/8E44AD/FFFFFF?text=Libro',
      isAvailable: true
    },
    {
      id: '17',
      name: 'Set de Lego Star Wars',
      category: ProductCategory.JUGUETES,
      price: 335958,
      originalPrice: 419958,
      discount: 20,
      stock: 22,
      description: 'Set de construcción con 750 piezas, incluye figuras coleccionables',
      imageUrl: 'https://via.placeholder.com/300x400/F39C12/FFFFFF?text=Lego',
      isAvailable: true
    },
    {
      id: '18',
      name: 'Raqueta de Tenis Wilson',
      category: ProductCategory.DEPORTES,
      price: 797958,
      stock: 15,
      description: 'Raqueta profesional con encordado de alta tensión',
      imageUrl: 'https://via.placeholder.com/300x400/27AE60/FFFFFF?text=Raqueta',
      isAvailable: true
    },
    {
      id: '19',
      name: 'Lámpara de Mesa LED',
      category: ProductCategory.HOGAR,
      price: 193158,
      originalPrice: 277158,
      discount: 30,
      stock: 60,
      description: 'Lámpara moderna con luz ajustable y diseño escandinavo',
      imageUrl: 'https://via.placeholder.com/300x400/F1C40F/FFFFFF?text=Lámpara',
      isAvailable: true
    },
    {
      id: '20',
      name: 'Peluche Gigante Oso',
      category: ProductCategory.JUGUETES,
      price: 167958,
      stock: 28,
      description: 'Peluche suave de 1 metro de altura, perfecto para niños y adultos',
      imageUrl: 'https://via.placeholder.com/300x400/8B7355/FFFFFF?text=Peluche',
      isAvailable: true
    }
  ];

  public getAllProducts(): Observable<Product[]> {
    return of(this.mockProducts).pipe(delay(300)); // Simular delay de red
  }

  public getProductsByFilter(filter: any): Observable<Product[]> {
    return of(this.mockProducts).pipe(delay(200));
  }

  public getProductById(id: string): Observable<Product | null> {
    const product = this.mockProducts.find(p => p.id === id);
    return of(product || null).pipe(delay(100));
  }

  public searchProducts(searchTerm: string): Observable<Product[]> {
    const filteredProducts = this.mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return of(filteredProducts).pipe(delay(200));
  }
} 