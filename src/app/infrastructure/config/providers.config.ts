import { Provider } from '@angular/core';
import { PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product.repository.port';
import { CART_SERVICE_PORT } from '../../domain/ports/cart.service.port';
import { MockProductRepository } from '../adapters/mock-product.repository';
import { CartApplicationService } from '../../application/services/cart.service';
import { UiContextService } from '../../application/services/ui-context.service';
import { ApiService } from '../../application/services/api.service';

export const INFRASTRUCTURE_PROVIDERS: Provider[] = [
  {
    provide: PRODUCT_REPOSITORY_PORT,
    useClass: MockProductRepository
  },
  {
    provide: CART_SERVICE_PORT,
    useClass: CartApplicationService
  },
  UiContextService,
  ApiService
]; 