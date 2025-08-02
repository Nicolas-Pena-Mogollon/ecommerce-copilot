import { Routes } from '@angular/router';
import { ProductListComponent } from './presentation/components/product-list/product-list.component';
import { CartComponent } from './presentation/components/cart/cart.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'cart', component: CartComponent },
  { path: '**', redirectTo: '' }
];
