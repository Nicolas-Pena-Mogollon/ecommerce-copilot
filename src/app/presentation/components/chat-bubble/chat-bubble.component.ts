import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiContextService } from '../../../application/services/ui-context.service';
import { DynamicPopupService } from '../../../application/services/dynamic-popup.service';
import { ApiService } from '../../../application/services/api.service';
import { VoiceChatComponent } from '../voice-chat/voice-chat.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule, VoiceChatComponent],
  template: `
    <div class="chat-container">
      <!-- Botón principal del agente -->
      <button 
        class="main-agent-button" 
        (click)="toggleAgentMenu()"
        [class.expanded]="isAgentMenuOpen"
      >
        <img src="/logos/agente.png" alt="Agente de Ventas" class="agent-icon">
      </button>

      <!-- Menú circular de agentes -->
      <div class="agent-menu" *ngIf="isAgentMenuOpen">
        <!-- Chat tradicional -->
        <button 
          class="agent-option chat-agent"
          (click)="openChat('chat')"
          title="Chat de Ayuda"
        >
          <img src="/logos/chat.png" alt="Chat" class="option-icon">
        </button>

        <!-- Asistente de voz -->
        <button 
          class="agent-option voice-agent"
          (click)="openChat('voice')"
          title="Asistente de Voz"
        >
          <img src="/logos/voz.png" alt="Voz" class="option-icon">
        </button>

        <!-- Botón de salir -->
        <button 
          class="agent-option sales-agent"
          (click)="closeMenu()"
          title="Cerrar menú"
        >
          <span class="option-icon">✕</span>
        </button>
      </div>

      <!-- Ventana del chat -->
      <div class="chat-window" *ngIf="isChatOpen">
        <!-- Chat de voz -->
        <app-voice-chat *ngIf="currentAgentType === 'voice'" (closeChat)="closeChat()"></app-voice-chat>
        
        <!-- Chat tradicional y de ventas -->
        <div class="chat-container" *ngIf="currentAgentType !== 'voice'">
          <div class="chat-header">
            <div class="header-info">
              <span class="agent-type-icon">{{ getAgentIcon() }}</span>
              <h3>{{ getAgentTitle() }}</h3>
            </div>
            <button class="close-btn" (click)="closeChat()">×</button>
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
              [placeholder]="getInputPlaceholder()"
              [(ngModel)]="userInput"
              (keyup.enter)="sendMessage()"
            />
            <button class="send-btn" (click)="sendMessage()">
              {{ getSendButtonIcon() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent {
  private uiContextService = inject(UiContextService);
  private popupService = inject(DynamicPopupService);
  private apiService = inject(ApiService);

  isAgentMenuOpen = false;
  isChatOpen = false;
  currentAgentType: 'chat' | 'voice' | 'sales' = 'chat';
  userInput = '';
  messages: Array<{text: string; isUser: boolean; time: string}> = [];

  toggleAgentMenu(): void {
    this.isAgentMenuOpen = !this.isAgentMenuOpen;
    if (!this.isAgentMenuOpen) {
      this.closeChat();
    }
  }

  closeMenu(): void {
    this.isAgentMenuOpen = false;
    this.closeChat();
  }

  openChat(agentType: 'chat' | 'voice' | 'sales'): void {
    this.currentAgentType = agentType;
    this.isChatOpen = true;
    this.isAgentMenuOpen = false;
    
    // Solo agregar mensaje de bienvenida para chat y ventas (no para voz)
    if (agentType !== 'voice') {
      this.addWelcomeMessage();
    }
  }

  closeChat(): void {
    this.isChatOpen = false;
    this.messages = [];
    this.userInput = '';
  }

  private addWelcomeMessage(): void {
    const welcomeMessages = {
      chat: '¡Hola! Soy tu asistente de chat. ¿En qué puedo ayudarte hoy?',
      voice: '¡Hola! Soy tu asistente de voz. Habla conmigo para que te ayude.',
      sales: '¡Hola! Soy tu agente de ventas personal. Te ayudo a encontrar los mejores productos y ofertas.'
    };

    this.messages.push({
      text: welcomeMessages[this.currentAgentType],
      isUser: false,
      time: this.formatTime(new Date())
    });

    // Scroll al mensaje de bienvenida
    setTimeout(() => this.scrollToBottom(), 100);
  }

  async sendMessage(): Promise<void> {
    if (!this.userInput.trim()) return;

    // Agregar mensaje del usuario
    this.messages.push({
      text: this.userInput,
      isUser: true,
      time: this.formatTime(new Date())
    });

    const userInput = this.userInput;
    this.userInput = '';

    // Scroll al último mensaje después de enviar
    setTimeout(() => this.scrollToBottom(), 100);

    await this.processMessageByAgent(userInput);
  }

  private async processMessageByAgent(userInput: string): Promise<void> {
    const uiContext = await this.uiContextService.getUiContextWithData(userInput);
    
    // Imprimir el JSON completo en la consola
    console.log('=== JSON COMPLETO CAPTURADO ===');
    console.log(JSON.stringify({
      userInput: userInput,
      uiContext: uiContext,
      agentType: this.currentAgentType
    }, null, 2));
    console.log('=== FIN DEL JSON ===');
    
    let response: string;

    switch (this.currentAgentType) {
      case 'chat':
        response = await this.processChatAgent(userInput, uiContext);
        break;
      case 'voice':
        response = await this.processVoiceAgent(userInput, uiContext);
        break;
      case 'sales':
        response = await this.processSalesAgent(userInput, uiContext);
        break;
      default:
        response = 'Lo siento, no pude procesar tu mensaje.';
    }

    this.messages.push({
      text: response,
      isUser: false,
      time: this.formatTime(new Date())
    });

    // Scroll al último mensaje después de recibir respuesta
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private async processChatAgent(userInput: string, uiContext: any): Promise<string> {
    // Lógica del chat tradicional
    try {
      // Crear el payload sin HTML y sin agentType para el backend
      const backendPayload = {
        userInput: userInput,
        uiContext: {
          ...uiContext,
          pageHtml: '' // Campo HTML vacío como solicitado
        }
      };

      // Enviar al backend
      const apiResponse = await firstValueFrom(this.apiService.sendWrittenChatContext(backendPayload));

      // Verificar si hay popup o steps para mostrar
      if (apiResponse && (apiResponse.popup || apiResponse.steps)) {
        setTimeout(() => {
          this.popupService.createPopupFromApiResponse(apiResponse);
        }, 100);
      }

      return apiResponse?.response || 'Entiendo tu consulta. ¿En qué puedo ayudarte?';
    } catch (error) {
      console.error('Error al enviar mensaje al backend:', error);
      return 'Entiendo tu consulta. ¿En qué puedo ayudarte con tu experiencia de compra?';
    }
  }

  private async processVoiceAgent(userInput: string, uiContext: any): Promise<string> {
    // Lógica específica para asistente de voz
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('buscar') || lowerInput.includes('encontrar')) {
      return 'Te ayudo a buscar productos. ¿Qué tipo de producto necesitas?';
    }
    
    if (lowerInput.includes('precio') || lowerInput.includes('costo')) {
      return 'Te puedo ayudar con información de precios y ofertas especiales.';
    }
    
    return 'He escuchado tu consulta. Te ayudo con información sobre nuestros productos.';
  }

  private async processSalesAgent(userInput: string, uiContext: any): Promise<string> {
    // Lógica específica para agente de ventas
    try {
      // Crear el payload sin HTML y sin agentType para el backend
      const backendPayload = {
        userInput: userInput,
        uiContext: {
          ...uiContext,
          pageHtml: '' // Campo HTML vacío como solicitado
        }
      };

      // Enviar al backend
      const apiResponse = await firstValueFrom(this.apiService.sendWrittenChatContext(backendPayload));

      // Verificar si hay popup o steps para mostrar
      if (apiResponse && (apiResponse.popup || apiResponse.steps)) {
        setTimeout(() => {
          this.popupService.createPopupFromApiResponse(apiResponse);
        }, 100);
      }

      return apiResponse?.response || 'Como tu agente de ventas personal, estoy aquí para ayudarte a encontrar los mejores productos al mejor precio.';
    } catch (error) {
      console.error('Error al enviar mensaje al backend:', error);
      
      // Fallback a lógica local si falla el backend
      const lowerInput = userInput.toLowerCase();
      
      if (lowerInput.includes('oferta') || lowerInput.includes('descuento')) {
        return '¡Excelente! Tenemos ofertas especiales en este momento. Te muestro las mejores promociones disponibles.';
      }
      
      if (lowerInput.includes('recomendar') || lowerInput.includes('sugerir')) {
        return 'Basándome en tus preferencias, te recomiendo estos productos que podrían interesarte.';
      }
      
      if (lowerInput.includes('comprar') || lowerInput.includes('adquirir')) {
        return '¡Perfecto! Te guío en el proceso de compra. ¿Ya tienes algo específico en mente?';
      }
      
      return 'Como tu agente de ventas personal, estoy aquí para ayudarte a encontrar los mejores productos al mejor precio.';
    }
  }

  getAgentIcon(): string {
    const icons = {
      chat: '💬',
      voice: '🎤',
      sales: '🛒'
    };
    return icons[this.currentAgentType];
  }

  getAgentTitle(): string {
    const titles = {
      chat: 'Chat de Ayuda',
      voice: 'Asistente de Voz',
      sales: 'Agente de Ventas'
    };
    return titles[this.currentAgentType];
  }

  getInputPlaceholder(): string {
    const placeholders = {
      chat: 'Escribe tu mensaje...',
      voice: 'Escribe o habla tu consulta...',
      sales: '¿Qué producto te interesa?'
    };
    return placeholders[this.currentAgentType];
  }

  getSendButtonIcon(): string {
    const icons = {
      chat: '➤',
      voice: '🎤',
      sales: '➤'
    };
    return icons[this.currentAgentType];
  }

  /**
   * Método de prueba temporal para crear un popup con pasos
   */
  testStepPopup(): void {
    console.log('Testing step popup...');
    this.popupService.createTestStepPopup();
  }

  /**
   * Formatea la hora para mostrar solo hora y minuto en formato AM/PM
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Hace scroll al último mensaje del chat
   */
  private scrollToBottom(): void {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
} 