import { Component, inject, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceAgentService, VoiceAgentState } from '../../../application/services/voice-agent.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-voice-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voice-chat-container">
      <!-- Header del chat de voz -->
      <div class="voice-chat-header">
        <div class="header-info">
          <span class="voice-icon">🎤</span>
          <h3>Asistente de Voz</h3>
        </div>
        <button class="close-btn" (click)="closeVoiceChat()">×</button>
      </div>

      <!-- Estado del agente -->
      <div class="voice-status">
        <div class="status-indicator" [class]="getStatusClass()">
          <div class="status-dot"></div>
          <span class="status-text">{{ getStatusText() }}</span>
        </div>
      </div>

      <!-- Indicador de estado de voz mejorado -->
      <div class="voice-status-indicator">
        <div class="status-text listening" *ngIf="state.isListening">
          🎤 Escuchando... (Presiona el botón para detener)
        </div>
        <div class="status-text processing" *ngIf="state.isProcessing">
          ⚙️ Procesando tu consulta...
        </div>
        <div class="status-text speaking" *ngIf="isAssistantSpeaking()">
          🔊 Asistente hablando... (Presiona el botón para interrumpir)
        </div>
        <div class="status-text ready" *ngIf="!state.isListening && !state.isProcessing && !isAssistantSpeaking() && state.hasPermission">
          ✅ Listo para escuchar
        </div>
      </div>

      <!-- Controles de voz -->
      <div class="voice-controls">
        <!-- Botón principal de micrófono -->
        <button 
          class="mic-button"
          [class.listening]="state.isListening"
          [class.processing]="state.isProcessing"
          [class.speaking]="isAssistantSpeaking()"
          [disabled]="!state.hasPermission || !state.isSupported"
          (click)="toggleListening()"
          title="{{ getMicButtonTitle() }}"
        >
          <span class="mic-icon" *ngIf="!isAssistantSpeaking()">🎤</span>
          <span class="mic-icon" *ngIf="isAssistantSpeaking()">🔊</span>
          <div class="listening-animation" *ngIf="state.isListening">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
          </div>
        </button>

        <!-- Texto reconocido -->
        <div class="recognized-text" *ngIf="state.lastRecognizedText">
          <span class="label">Reconocido:</span>
          <span class="text">{{ state.lastRecognizedText }}</span>
        </div>

        <!-- Botón para detener síntesis -->
        <button 
          class="stop-speaking-btn"
          (click)="stopSpeaking()"
          title="Detener síntesis de voz"
          *ngIf="isAssistantSpeaking()"
        >
          🔇
        </button>
      </div>

      <!-- Mensajes de error -->
      <div class="error-message" *ngIf="state.error">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ state.error }}</span>
        <button class="clear-error-btn" (click)="clearError()">×</button>
      </div>

      <!-- Instrucciones -->
      <div class="instructions" *ngIf="!state.hasPermission">
        <p>Para usar el asistente de voz, necesitas dar permiso para acceder al micrófono.</p>
        <button class="permission-btn" (click)="requestPermission()">
          Dar Permiso de Micrófono
        </button>
      </div>

      <div class="instructions" *ngIf="state.hasPermission && !state.isListening && !state.isProcessing && !isAssistantSpeaking()">
        <p>Presiona el botón del micrófono y habla. Puedes decir cosas como:</p>
        <ul>
          <li>"Mostrar ofertas"</li>
          <li>"¿Qué productos tienen descuento?"</li>
          <li>"Buscar productos"</li>
        </ul>
        <p class="tip">💡 <strong>Tip:</strong> El asistente se callará automáticamente cuando actives el micrófono.</p>
      </div>
    </div>
  `,
  styleUrls: ['./voice-chat.component.scss']
})
export class VoiceChatComponent implements OnInit, OnDestroy {
  @Output() closeChat = new EventEmitter<void>();
  
  private voiceAgentService = inject(VoiceAgentService);
  private subscription = new Subscription();

  state: VoiceAgentState = {
    isListening: false,
    isProcessing: false,
    hasPermission: false,
    isSupported: false,
    lastRecognizedText: '',
    error: null
  };



  ngOnInit(): void {
    // Suscribirse al estado del agente de voz
    this.subscription.add(
      this.voiceAgentService.state$.subscribe(state => {
        this.state = state;
        this.handleStateChange(state);
      })
    );

    // Verificar permisos existentes primero
    this.checkExistingPermissions();
  }

  private async checkExistingPermissions(): Promise<void> {
    const hasPermission = await this.voiceAgentService.checkPermissions();
    console.log('Permisos existentes verificados:', hasPermission);
    
    if (hasPermission) {
      // Si ya tiene permisos, inicializar directamente
      this.initializeVoiceAgent();
    } else {
      // Si no tiene permisos, solicitar automáticamente
      await this.requestPermission();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.voiceAgentService.stopListening();
    this.voiceAgentService.stopSpeaking();
  }

  private async initializeVoiceAgent(): Promise<void> {
    const success = await this.voiceAgentService.initializeVoiceAgent();
    if (!success) {
      console.error('No se pudo inicializar el asistente de voz');
    }
  }

  private handleStateChange(state: VoiceAgentState): void {
    console.log('Estado del agente de voz actualizado:', state);
    
    // Verificar si los permisos cambiaron
    if (state.hasPermission && !this.state.hasPermission) {
      console.log('Permisos otorgados - habilitando botón de micrófono');
    }
  }

  async toggleListening(): Promise<void> {
    if (this.state.isListening) {
      this.voiceAgentService.stopListening();
    } else if (!this.state.isProcessing) {
      await this.voiceAgentService.startListening();
    }
  }

  stopSpeaking(): void {
    this.voiceAgentService.stopSpeaking();
  }

  async requestPermission(): Promise<void> {
    console.log('Solicitando permisos de micrófono...');
    const success = await this.voiceAgentService.initializeVoiceAgent();
    console.log('Resultado de solicitud de permisos:', success);
    
    if (!success) {
      console.error('No se pudieron obtener los permisos');
    }
  }

  clearError(): void {
    this.voiceAgentService.clearError();
  }

  closeVoiceChat(): void {
    this.voiceAgentService.stopListening();
    this.voiceAgentService.stopSpeaking();
    // Emitir evento para cerrar el chat
    this.closeChat.emit();
  }

  isAssistantSpeaking(): boolean {
    return this.voiceAgentService.isAssistantSpeaking();
  }

  getStatusClass(): string {
    if (this.state.isListening) return 'listening';
    if (this.state.isProcessing) return 'processing';
    if (!this.state.hasPermission) return 'no-permission';
    if (!this.state.isSupported) return 'not-supported';
    return 'ready';
  }

  getStatusText(): string {
    if (this.state.isListening) return 'Escuchando...';
    if (this.state.isProcessing) return 'Procesando...';
    if (!this.state.hasPermission) return 'Sin permisos';
    if (!this.state.isSupported) return 'No soportado';
    return 'Listo';
  }

  getMicButtonTitle(): string {
    if (!this.state.hasPermission) return 'Se requieren permisos de micrófono';
    if (!this.state.isSupported) return 'Tu navegador no soporta reconocimiento de voz';
    if (this.state.isProcessing) return 'Procesando consulta...';
    if (this.state.isListening) return 'Detener escucha';
    return 'Iniciar escucha';
  }
} 