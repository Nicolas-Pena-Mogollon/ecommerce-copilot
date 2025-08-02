import { Injectable, inject } from '@angular/core';
import { VOICE_SERVICE_PORT, VoiceServicePort } from '../../domain/ports/voice.service.port';
import { ApiService, ChatPayload } from './api.service';
import { UiContextService } from './ui-context.service';
import { DynamicPopupService } from './dynamic-popup.service';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

export interface VoiceAgentState {
  isListening: boolean;
  isProcessing: boolean;
  hasAssistantSpeaking: boolean;
  hasPermission: boolean;
  isSupported: boolean;
  lastRecognizedText: string;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceAgentService {
  private voiceService = inject(VOICE_SERVICE_PORT);
  private apiService = inject(ApiService);
  private uiContextService = inject(UiContextService);
  private popupService = inject(DynamicPopupService);

  private stateSubject = new BehaviorSubject<VoiceAgentState>({
    isListening: false,
    isProcessing: false,
    hasAssistantSpeaking: false,
    hasPermission: false,
    isSupported: false,
    lastRecognizedText: '',
    error: null
  });

  public state$: Observable<VoiceAgentState> = this.stateSubject.asObservable();

  constructor() {
    this.setupVoiceAgent().catch(error => {
      console.error('Error en setupVoiceAgent:', error);
    });
  }

  private async setupVoiceAgent(): Promise<void> {
    // Verificar soporte
    const isSupported = this.voiceService.isSpeechSupported();
    this.updateState({ isSupported });

    if (!isSupported) {
      this.updateState({ error: 'Tu navegador no soporta la funcionalidad de voz' });
      return;
    }

    // Verificar permisos existentes
    try {
      const hasPermission = await this.voiceService.checkMicrophonePermission();
      this.updateState({ hasPermission });
    } catch (error) {
      console.error('Error verificando permisos:', error);
    }

    // Configurar callbacks
    this.voiceService.onSpeechResult((text: string) => {
      this.handleSpeechResult(text);
    });

    this.voiceService.onSpeechError((error: string) => {
      this.updateState({ 
        error: `Error de reconocimiento: ${error}`,
        isListening: false,
        isProcessing: false
      });
    });

    this.voiceService.onSpeechEnd(() => {
      this.updateState({ isListening: false });
    });

    this.voiceService.onSilenceTimeout(() => {
      this.handleSilenceTimeout();
    });
  }

  /**
   * Inicializa el agente de voz solicitando permisos
   */
  public async initializeVoiceAgent(): Promise<boolean> {
    try {
      this.updateState({ error: null });
      
      // Configurar callbacks primero
      await this.setupVoiceAgent();
      
      // Solicitar permisos de micrófono
      const hasPermission = await this.voiceService.requestMicrophonePermission();
      
      // Actualizar estado inmediatamente
      this.updateState({ hasPermission });

      if (!hasPermission) {
        this.updateState({ error: 'Se requieren permisos de micrófono para usar el agente de voz' });
        return false;
      }

      // Mensaje de bienvenida
      await this.speakWelcomeMessage();
      return true;
    } catch (error) {
      console.error('Error en initializeVoiceAgent:', error);
      this.updateState({ 
        error: `Error al inicializar el agente de voz: ${error}` 
      });
      return false;
    }
  }

    /**
   * Inicia el reconocimiento de voz
   */
  async startListening(): Promise<void> {
    try {
      // Si el asistente está hablando, detenerlo primero
      if (this.voiceService.isSpeaking()) {
        this.voiceService.stopSpeaking();
      }

      this.updateState({ error: null, isListening: true });
      await this.voiceService.startSpeechRecognition();
    } catch (error) {
      console.error('Error iniciando reconocimiento de voz:', error);
      this.updateState({
        error: `Error al iniciar el reconocimiento: ${error}`,
        isListening: false
      });
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  stopListening(): void {
    this.voiceService.stopSpeechRecognition();
    this.updateState({ isListening: false });
  }

  /**
   * Maneja el resultado del reconocimiento de voz
   */
  private async handleSpeechResult(text: string): Promise<void> {
    // Detener el reconocimiento inmediatamente para evitar procesamiento múltiple
    this.voiceService.stopSpeechRecognition();
    
    // ACTUALIZACIÓN INMEDIATA: Cambiar a procesamiento inmediatamente
    this.updateState({ 
      lastRecognizedText: text,
      isProcessing: true,
      isListening: false // Detener escucha inmediatamente
    });

    try {
      // Obtener el contexto UI
      const uiContext = await this.uiContextService.getUiContextWithData(text);
      
      // Crear el payload con la misma estructura que el chat escrito
      const backendPayload = {
        userInput: text,
        uiContext: {
          ...uiContext,
          pageHtml: '' // Campo HTML vacío como en el chat escrito
        }
      };

      // Enviar al mismo endpoint que el chat escrito
      const response = await firstValueFrom(this.apiService.sendWrittenChatContext(backendPayload));
      
      // Manejar popup si existe en la respuesta (igual que en chat de texto)
      if (response && (response.popup || response.steps)) {
        setTimeout(() => {
          this.popupService.createPopupFromApiResponse(response);
        }, 100);
      }
      
      if (response && response.response) {
        // Leer la respuesta del backend en voz alta
        await this.voiceService.speakText(response.response);
      } else {
        // Caso específico cuando no hay respuesta del servidor
        await this.voiceService.speakText('Estamos teniendo problemas con el servicio. Intenta más tarde.');
      }

      // Solo cambiar a no procesando cuando termine de hablar
      this.updateState({ isProcessing: false });
      
      // Resetear el estado de procesamiento para permitir nuevos resultados
      this.voiceService.resetProcessingState();
    } catch (error) {
      console.error('Error procesando voz:', error);
      
      // Mensaje específico para errores de conexión o servicio
      await this.voiceService.speakText('Estamos teniendo problemas con el servicio. Intenta más tarde.');
      
      // Solo cambiar a no procesando cuando termine de hablar el mensaje de error
      this.updateState({ 
        isProcessing: false,
        error: `Error procesando consulta: ${error}`
      });
      
      // Resetear el estado de procesamiento incluso en caso de error
      this.voiceService.resetProcessingState();
    }
  }

  /**
   * Lee un mensaje de bienvenida
   */
  private async speakWelcomeMessage(): Promise<void> {
    const welcomeMessage = 
      '¡Hola! Soy tu asistente de voz. ' +
      'Di algo como "buscar productos" o "mostrar ofertas" para empezar.';
    
    await this.voiceService.speakText(welcomeMessage);
  }

  /**
   * Lee un texto específico
   */
  async speakText(text: string): Promise<void> {
    try {
      // Marcar que el asistente va a empezar a hablar
      this.updateState({ hasAssistantSpeaking: true });
      
      await this.voiceService.speakText(text);
      
      // Marcar que el asistente terminó de hablar
      this.updateState({ hasAssistantSpeaking: false });
    } catch (error) {
      console.error('Error al leer texto:', error);
      this.updateState({ 
        error: `Error al leer texto: ${error}`,
        hasAssistantSpeaking: false 
      });
    }
  }

  /**
   * Detiene la síntesis de voz
   */
  stopSpeaking(): void {
    this.voiceService.stopSpeaking();
    this.updateState({ hasAssistantSpeaking: false });
  }

  /**
   * Verifica si el asistente está hablando
   */
  isAssistantSpeaking(): boolean {
    return this.stateSubject.value.hasAssistantSpeaking;
  }

  /**
   * Actualiza el estado del agente
   */
  private updateState(partialState: Partial<VoiceAgentState>): void {
    const newState = {
      ...this.stateSubject.value,
      ...partialState
    };
    this.stateSubject.next(newState);
  }

  /**
   * Obtiene el estado actual
   */
  getCurrentState(): VoiceAgentState {
    return this.stateSubject.value;
  }

  /**
   * Verifica permisos de micrófono sin solicitarlos
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const hasPermission = await this.voiceService.checkMicrophonePermission();
      this.updateState({ hasPermission });
      return hasPermission;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  /**
   * Maneja el timeout de silencio - no hace procesamiento automático
   */
  async handleSilenceTimeout(): Promise<void> {
    console.log('Timeout de silencio alcanzado, pero no procesando automáticamente');
    // No hacemos nada aquí, el usuario debe presionar el botón para detener manualmente
  }

  /**
   * Limpia errores
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * Limpia completamente el reconocimiento de voz
   */
  cleanup(): void {
    this.voiceService.cleanupSpeechRecognition();
    this.updateState({
      isListening: false,
      isProcessing: false,
      hasAssistantSpeaking: false,
      lastRecognizedText: '',
      error: null
    });
  }

  /**
   * Reinicializa el agente de voz después de una limpieza
   */
  public async reinitializeVoiceAgent(): Promise<boolean> {
    try {
      // Reinicializar el reconocimiento de voz
      this.voiceService.reinitializeSpeechRecognition();
      
      // Reconfigurar callbacks después de la limpieza
      this.voiceService.onSpeechResult((text: string) => {
        this.handleSpeechResult(text);
      });

      this.voiceService.onSpeechError((error: string) => {
        this.updateState({ 
          error: `Error de reconocimiento: ${error}`,
          isListening: false,
          isProcessing: false
        });
      });

      this.voiceService.onSpeechEnd(() => {
        this.updateState({ isListening: false });
      });

      this.voiceService.onSilenceTimeout(() => {
        this.handleSilenceTimeout();
      });

      // Verificar permisos existentes
      const hasPermission = await this.voiceService.checkMicrophonePermission();
      this.updateState({ hasPermission });

      return hasPermission;
    } catch (error) {
      console.error('Error reinicializando agente de voz:', error);
      return false;
    }
  }
} 