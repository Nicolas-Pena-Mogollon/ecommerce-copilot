import { Injectable } from '@angular/core';
import { CartService } from './cart.service'; // crea uno si no existe aún
import { ProductService } from './product.service'; // crea uno si no existe aún

@Injectable({
  providedIn: 'root'
})
export class UiContextService {
  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

  getUiContext(userInput: string): any {
    return {
      view: this.getCurrentView(), // puedes actualizarlo dinámicamente si tienes rutas
      cartItems: this.cartService.getItems().map((p) => p.name),
      visibleProducts: this.productService.getVisibleProducts().map((p) => ({
        name: p.name,
        price: p.price
      }))
    };
  }

  private getCurrentView(): string {
    // aquí puedes usar el router para identificar la ruta actual
    return 'catalog';
  }
}
