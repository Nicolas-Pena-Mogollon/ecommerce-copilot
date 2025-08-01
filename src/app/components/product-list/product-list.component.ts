import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PRODUCTS, Product } from '../../data/products';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent {
  products: Product[] = PRODUCTS;

  addToCart(product: Product) {
    console.log('Producto agregado al carrito:', product);
    // puedes guardar en localStorage, o emitir evento a otro componente
  }
}
