import { Provider } from '@angular/core';
import { PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product.repository.port';
import { CART_SERVICE_PORT } from '../../domain/ports/cart.service.port';
import { VOICE_SERVICE_PORT } from '../../domain/ports/voice.service.port';
import { MockProductRepository } from '../adapters/mock-product.repository';
import { CartApplicationService } from '../../application/services/cart.service';
import { UiContextService } from '../../application/services/ui-context.service';
import { ApiService } from '../../application/services/api.service';
import { WebSpeechService } from '../adapters/web-speech.service';
import { VoiceAgentService } from '../../application/services/voice-agent.service';

export const INFRASTRUCTURE_PROVIDERS: Provider[] = [
  {
    provide: PRODUCT_REPOSITORY_PORT,
    useClass: MockProductRepository
  },
  {
    provide: CART_SERVICE_PORT,
    useClass: CartApplicationService
  },
  {
    provide: VOICE_SERVICE_PORT,
    useClass: WebSpeechService
  },
  UiContextService,
  ApiService,
  VoiceAgentService
]; 