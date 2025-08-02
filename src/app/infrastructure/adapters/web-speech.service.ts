import { Injectable } from '@angular/core';
import { VoiceServicePort } from '../../domain/ports/voice.service.port';

@Injectable({
  providedIn: 'root'
})
export class WebSpeechService implements VoiceServicePort {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognitionState: 'inactive' | 'listening' | 'processing' = 'inactive';
  private silenceTimeout: any = null;
  private readonly SILENCE_TIMEOUT = 2000; // Reducido a 2 segundos para mejor performance
  private isProcessingResult = false; // Control para evitar múltiples llamadas al API
  private isAssistantSpeaking = false; // Control para saber si está hablando el asistente
  
  // Callbacks para eventos
  private onSpeechResultCallback: ((text: string) => void) | null = null;
  private onSpeechErrorCallback: ((error: string) => void) | null = null;
  private onSpeechEndCallback: (() => void) | null = null;
  private onSilenceTimeoutCallback: (() => void) | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    if (!this.isSpeechSupported()) {
      console.warn('Web Speech API no está soportada en este navegador');
      return;
    }

    // Inicializar reconocimiento de voz
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Mantener continuo
      this.recognition.interimResults = true; // Habilitar resultados intermedios para mejor performance
      this.recognition.lang = 'es-ES'; // Configurar para español
      this.recognition.maxAlternatives = 1;

      // Configurar eventos del reconocimiento
      this.recognition.onstart = () => {
        this.recognitionState = 'listening';
        this.isProcessingResult = false; // Resetear al iniciar
        console.log('Reconocimiento de voz iniciado');
        
        // Interrumpir síntesis si está hablando
        if (this.isAssistantSpeaking) {
          this.stopSpeaking();
        }
      };

      this.recognition.onresult = (event: any) => {
        // Solo procesar si no estamos procesando ya un resultado
        if (this.isProcessingResult) {
          console.log('Ya se está procesando un resultado, ignorando nuevo texto');
          return;
        }

        // Verificar si es un resultado final
        const isFinal = event.results[event.results.length - 1].isFinal;
        if (!isFinal) {
          return; // No procesar resultados intermedios
        }

        this.recognitionState = 'processing';
        this.isProcessingResult = true; // Marcar como procesando
        this.clearSilenceTimeout(); // Limpiar timeout cuando se detecta voz
        
        const transcript = event.results[event.results.length - 1][0].transcript; // Obtener el último resultado
        console.log('Texto reconocido (final):', transcript);
        
        if (this.onSpeechResultCallback) {
          this.onSpeechResultCallback(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.recognitionState = 'inactive';
        this.isProcessingResult = false; // Resetear en caso de error
        const error = event.error;
        console.error('Error en reconocimiento de voz:', error);
        
        if (this.onSpeechErrorCallback) {
          this.onSpeechErrorCallback(error);
        }
      };

      this.recognition.onend = () => {
        this.recognitionState = 'inactive';
        this.isProcessingResult = false; // Resetear al finalizar
        console.log('Reconocimiento de voz finalizado');
        
        if (this.onSpeechEndCallback) {
          this.onSpeechEndCallback();
        }
      };
    }
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissions.state === 'granted';
    } catch (error) {
      console.error('Error al verificar permisos de micrófono:', error);
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Verificar si ya tenemos permisos
      const hasPermission = await this.checkMicrophonePermission();
      if (hasPermission) {
        console.log('Permisos de micrófono ya otorgados');
        return true;
      }
      
      // Solicitar permisos
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Verificar que realmente tenemos el stream
      if (stream && stream.active) {
        stream.getTracks().forEach(track => track.stop()); // Liberar el stream
        console.log('Permisos de micrófono otorgados exitosamente');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al solicitar permisos de micrófono:', error);
      return false;
    }
  }

  async startSpeechRecognition(): Promise<void> {
    if (!this.isSpeechSupported()) {
      throw new Error('Web Speech API no está soportada en este navegador');
    }

    if (this.recognitionState === 'listening') {
      console.warn('El reconocimiento de voz ya está activo');
      return;
    }

    try {
      this.recognition.start();
      this.startSilenceTimeout();
    } catch (error) {
      console.error('Error al iniciar reconocimiento de voz:', error);
      throw error;
    }
  }

  private startSilenceTimeout(): void {
    this.clearSilenceTimeout();
    this.silenceTimeout = setTimeout(() => {
      console.log('Timeout de silencio alcanzado, pero manteniendo reconocimiento activo');
      // Ya no detenemos el reconocimiento automáticamente
      // Solo llamamos al callback si es necesario
      if (this.onSilenceTimeoutCallback) {
        this.onSilenceTimeoutCallback();
      }
    }, this.SILENCE_TIMEOUT);
  }

  private clearSilenceTimeout(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  stopSpeechRecognition(): void {
    this.clearSilenceTimeout(); // Limpiar timeout al detener
    if (this.recognition && this.recognitionState === 'listening') {
      this.recognition.stop();
    }
  }

  async speakText(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Síntesis de voz no soportada'));
        return;
      }

      // Detener cualquier síntesis anterior
      this.stopSpeaking();

      // Crear nueva síntesis
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance.lang = 'es-ES';
      this.currentUtterance.rate = 1.0; // Velocidad normal para mejor claridad
      this.currentUtterance.pitch = 1.0;
      this.currentUtterance.volume = 1.0;

      // Configurar eventos
      this.currentUtterance.onstart = () => {
        this.isAssistantSpeaking = true; // Marcar que está hablando
        console.log('Asistente empezó a hablar');
      };

      this.currentUtterance.onend = () => {
        this.currentUtterance = null;
        this.isAssistantSpeaking = false; // Marcar que ya no está hablando
        console.log('Asistente terminó de hablar');
        resolve();
      };

      this.currentUtterance.onerror = (event) => {
        this.currentUtterance = null;
        this.isAssistantSpeaking = false; // Marcar que ya no está hablando
        reject(new Error(`Error en síntesis de voz: ${event.error}`));
      };

      // Iniciar síntesis
      this.synthesis.speak(this.currentUtterance);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    if (this.currentUtterance) {
      this.currentUtterance = null;
    }
    this.isAssistantSpeaking = false; // Marcar que ya no está hablando
  }

  /**
   * Resetea el estado de procesamiento para permitir nuevos resultados
   */
  resetProcessingState(): void {
    this.isProcessingResult = false;
  }

  /**
   * Verifica si el asistente está hablando
   */
  isSpeaking(): boolean {
    return this.isAssistantSpeaking;
  }

  isSpeechSupported(): boolean {
    return !!(window.speechSynthesis && 
             ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }

  getRecognitionState(): 'inactive' | 'listening' | 'processing' {
    return this.recognitionState;
  }

  onSpeechResult(callback: (text: string) => void): void {
    this.onSpeechResultCallback = callback;
  }

  onSpeechError(callback: (error: string) => void): void {
    this.onSpeechErrorCallback = callback;
  }

  onSpeechEnd(callback: () => void): void {
    this.onSpeechEndCallback = callback;
  }

  onSilenceTimeout(callback: () => void): void {
    this.onSilenceTimeoutCallback = callback;
  }
} 