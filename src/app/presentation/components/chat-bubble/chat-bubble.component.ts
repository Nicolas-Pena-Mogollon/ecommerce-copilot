import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiContextService } from '../../../application/services/ui-context.service';
import { DynamicPopupService } from '../../../application/services/dynamic-popup.service';
import { ApiService } from '../../../application/services/api.service'; // Added import for ApiService

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Botón flotante del chat -->
      <button class="chat-button" (click)="toggleChat()">
        💬
      </button>

      <!-- Ventana del chat -->
      <div class="chat-window" *ngIf="isOpen">
        <div class="chat-header">
          <h3>Chat de Ayuda</h3>
          <button class="close-btn" (click)="toggleChat()">×</button>
        </div>

        <div class="chat-messages">
          <div 
            *ngFor="let message of messages" 
            class="message"
            [class.user]="message.isUser"
            [class.system]="!message.isUser"
          >
            <div class="message-content">
              {{ message.text }}
            </div>
            <div class="message-time">{{ message.time }}</div>
          </div>
        </div>

        <div class="chat-input">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..." 
            [(ngModel)]="userInput"
            (keyup.enter)="sendMessage()"
          />
          <button class="send-btn" (click)="sendMessage()">Enviar</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent {
  private uiContextService = inject(UiContextService);
  private popupService = inject(DynamicPopupService);
  private apiService = inject(ApiService); // Added ApiService injection

  isOpen = false;
  userInput = '';
  messages: Array<{text: string; isUser: boolean; time: string}> = [];

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  async sendMessage(): Promise<void> {
    if (!this.userInput.trim()) return;

    // Agregar mensaje del usuario al chat
    this.messages.push({
      text: this.userInput,
      isUser: true,
      time: new Date().toLocaleTimeString()
    });

    const userInput = this.userInput;
    this.userInput = '';

    // Obtener contexto de la UI
    const uiContext = await this.uiContextService.getUiContextWithData(userInput);
    
    // Imprimir el JSON completo en la consola
    console.log('=== JSON COMPLETO CAPTURADO ===');
    console.log(JSON.stringify({
      userInput: userInput,
      uiContext: uiContext
    }, null, 2));
    console.log('=== FIN DEL JSON ===');

    // Procesar la respuesta del API
    await this.processApiResponse(userInput, uiContext);
  }

  private async generateAssistantResponse(userInput: string): Promise<string> {
    // Simular respuesta del asistente
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('camiseta') || lowerInput.includes('camisa')) {
      return 'Te ayudo a encontrar camisetas. Veo que tienes varias opciones disponibles. Te voy a mostrar las mejores opciones...';
    }
    
    if (lowerInput.includes('comprar') || lowerInput.includes('compra')) {
      return 'Perfecto, te voy a guiar en el proceso de compra. Primero necesito saber qué producto te interesa...';
    }
    
    return 'Entiendo tu consulta. ¿En qué puedo ayudarte con tu experiencia de compra?';
  }

  private async processApiResponse(userInput: string, uiContext: any): Promise<void> {
    try {
      let apiResponse: any;

      // Verificar si es una palabra clave específica para endpoint dinámico
      const lowerInput = userInput.toLowerCase();
      
      if (lowerInput.includes('camiseta')) {
        // Hacer GET request al endpoint específico
        console.log('Haciendo GET request a endpoint específico para "camiseta"');
        apiResponse = await this.apiService.getDynamicEndpoint('camiseta').toPromise();
        console.log('Respuesta del endpoint específico:', apiResponse);
      } else if (lowerInput.includes('comprar') || lowerInput.includes('filtro') || lowerInput.includes('carrito')) {
        // Usar simulación para otras palabras clave
        console.log('Usando simulación para:', lowerInput);
        apiResponse = this.simulateApiResponse(userInput, uiContext);
      } else {
        // Usar el endpoint general de chat
        apiResponse = await this.apiService.sendTextMessage({
          userInput: userInput,
          uiContext: uiContext
        }).toPromise();
        console.log('Respuesta del API general:', apiResponse);
      }

      // Procesar la respuesta del API
      if (apiResponse && apiResponse.popup) {
        console.log('Creando popup con:', apiResponse.popup);
        // Crear popup desde la respuesta del API con un pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
          this.popupService.createPopupFromApiResponse(apiResponse);
        }, 100);
      }

      // Agregar respuesta del asistente al chat
      const assistantResponse = apiResponse?.response || 'Lo siento, no pude procesar tu mensaje.';
      this.messages.push({
        text: assistantResponse,
        isUser: false,
        time: new Date().toLocaleTimeString()
      });

    } catch (error) {
      console.error('Error al procesar respuesta del API:', error);
      
      // Fallback a simulación si el API falla
      const simulatedResponse = this.simulateApiResponse(userInput, uiContext);
      
      if (simulatedResponse.popup) {
        console.log('Creando popup de fallback con:', simulatedResponse.popup);
        setTimeout(() => {
          this.popupService.createPopupFromApiResponse(simulatedResponse);
        }, 100);
      }

      this.messages.push({
        text: simulatedResponse.response,
        isUser: false,
        time: new Date().toLocaleTimeString()
      });
    }
  }

  private simulateApiResponse(userInput: string, context: any): any {
    const lowerInput = userInput.toLowerCase();
    
    // Simular diferentes tipos de respuestas según el input
    if (lowerInput.includes('camiseta') && context.visibleProducts.length > 0) {
      return {
        response: 'Te muestro información sobre este producto',
        popup: {
          type: 'info',
          target: '.product-card',
          title: 'Camiseta de Algodón',
          message: 'Producto de alta calidad con descuento del 20%',
          targetInfo: {
            productName: 'Camiseta de Algodón',
            elementIndex: 0
          }
        }
      };
    }
    
    if (lowerInput.includes('comprar') || lowerInput.includes('compra')) {
      return {
        response: 'Te guío en el proceso de compra',
        popup: {
          type: 'guide-step',
          target: '.navbar-search .search-input',
          title: 'Paso 1: Buscar Productos',
          message: 'Escribe aquí lo que quieres comprar'
        }
      };
    }

    // Prueba con filtros específicos
    if (lowerInput.includes('filtro') || lowerInput.includes('filtrar')) {
      if (lowerInput.includes('categoría') || lowerInput.includes('categoria')) {
        return {
          response: 'Te ayudo con el filtro de categoría',
          popup: {
            type: 'info',
            target: '.category-filter',
            title: 'Filtro de Categoría',
            message: 'Selecciona una categoría para filtrar productos',
            targetInfo: {
              filterType: 'category',
              filterValue: 'ropa'
            }
          }
        };
      }
      
      if (lowerInput.includes('precio')) {
        return {
          response: 'Te ayudo con el filtro de precio',
          popup: {
            type: 'info',
            target: '.price-filter',
            title: 'Filtro de Precio',
            message: 'Ajusta el rango de precios aquí',
            targetInfo: {
              filterType: 'price',
              filterValue: '0-100000'
            }
          }
        };
      }
      
      return {
        response: 'Te ayudo con los filtros',
        popup: {
          type: 'info',
          target: '.filters-sidebar',
          title: 'Filtros Disponibles',
          message: 'Aquí puedes filtrar por categoría, precio, descuento y disponibilidad.'
        }
      };
    }

    // Prueba con carrito
    if (lowerInput.includes('carrito') || lowerInput.includes('cart')) {
      return {
        response: 'Información sobre tu carrito',
        popup: {
          type: 'info',
          target: '.cart-link',
          title: 'Tu Carrito',
          message: `Tienes ${context.cartItems.length} productos en tu carrito.`
        }
      };
    }

    // Prueba con búsqueda
    if (lowerInput.includes('buscar') || lowerInput.includes('search')) {
      return {
        response: 'Te ayudo con la búsqueda',
        popup: {
          type: 'guide-step',
          target: '.search-btn',
          title: 'Búsqueda Inteligente',
          message: 'Haz clic aquí para buscar productos.'
        }
      };
    }

    // Prueba con productos específicos por nombre
    if (lowerInput.includes('laptop') || lowerInput.includes('computador')) {
      return {
        response: 'Te muestro las mejores laptops',
        popup: {
          type: 'info',
          target: '.product-card',
          title: 'Laptop Gaming',
          message: 'Ideal para gaming y trabajo profesional',
          targetInfo: {
            productName: 'Laptop Gaming Pro',
            elementIndex: 1
          }
        }
      };
    }

    // Prueba con botón de agregar al carrito
    if (lowerInput.includes('agregar') || lowerInput.includes('añadir')) {
      return {
        response: 'Te muestro cómo agregar productos al carrito',
        popup: {
          type: 'guide-step',
          target: '.product-card .add-to-cart-btn',
          title: 'Agregar al Carrito',
          message: 'Haz clic en este botón para agregar el producto a tu carrito.',
          targetInfo: {
            elementIndex: 0
          }
        }
      };
    }
    
    return {
      response: 'Respuesta estándar',
      popup: null
    };
  }

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
} 