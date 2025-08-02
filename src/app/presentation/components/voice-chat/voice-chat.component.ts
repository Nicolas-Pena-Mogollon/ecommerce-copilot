import { Component, inject, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceAgentService, VoiceAgentState } from '../../../application/services/voice-agent.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-voice-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-chat.component.html',
  styleUrls: ['./voice-chat.component.scss']
})
export class VoiceChatComponent implements OnInit, OnDestroy {
  @Output() closeChat = new EventEmitter<void>();
  
  private voiceAgentService = inject(VoiceAgentService);
  private subscription = new Subscription();
  private cdr = inject(ChangeDetectorRef);

  state: VoiceAgentState = {
    isListening: false,
    isProcessing: false,
    hasAssistantSpeaking: false,
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

  /**
   * Método público para reinicializar el componente cuando se vuelve a abrir
   */
  public async reinitialize(): Promise<void> {
    // Reinicializar el servicio de voz
    const success = await this.voiceAgentService.reinitializeVoiceAgent();
    if (success) {
      // Forzar actualización de la vista
      this.cdr.detectChanges();
    }
  }

  private async checkExistingPermissions(): Promise<void> {
    const hasPermission = await this.voiceAgentService.checkPermissions();
    
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
    this.voiceAgentService.cleanup();
  }

  private async initializeVoiceAgent(): Promise<void> {
    const success = await this.voiceAgentService.initializeVoiceAgent();
    if (!success) {
      console.error('No se pudo inicializar el asistente de voz');
    }
  }

  private handleStateChange(state: VoiceAgentState): void {
    // FORZAR DETECCIÓN DE CAMBIOS
    this.cdr.detectChanges();
  }

  async toggleListening(): Promise<void> {
    if (this.state.isListening) {
      this.voiceAgentService.stopListening();
    } else if (!this.state.isProcessing) {
      await this.voiceAgentService.startListening();
    }
    
    // FORZAR DETECCIÓN DE CAMBIOS
    this.cdr.detectChanges();
  }

  stopSpeaking(): void {
    this.voiceAgentService.stopSpeaking();
  }

  async requestPermission(): Promise<void> {
    const success = await this.voiceAgentService.initializeVoiceAgent();
    
    if (!success) {
      console.error('No se pudieron obtener los permisos');
    }
  }

  clearError(): void {
    this.voiceAgentService.clearError();
  }

  closeVoiceChat(): void {
    this.voiceAgentService.cleanup();
    // Emitir evento para cerrar el chat
    this.closeChat.emit();
  }

  isAssistantSpeaking(): boolean {
    return this.voiceAgentService.isAssistantSpeaking();
  }



  getMicButtonTitle(): string {
    if (!this.state.hasPermission) return 'Se requieren permisos de micrófono';
    if (!this.state.isSupported) return 'Tu navegador no soporta reconocimiento de voz';
    if (this.state.hasAssistantSpeaking) return 'El asistente está hablando - espera a que termine';
    if (this.state.isProcessing) return 'Procesando consulta...';
    if (this.state.isListening) return 'Detener escucha';
    return 'Iniciar escucha';
  }

  /**
   * Obtiene la hora actual formateada
   */
  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }




} 