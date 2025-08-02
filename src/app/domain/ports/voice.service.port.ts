import { InjectionToken } from '@angular/core';

export interface VoiceServicePort {
  /**
   * Solicita permisos para acceder al micrófono
   */
  requestMicrophonePermission(): Promise<boolean>;

  /**
   * Verifica si ya se tienen permisos de micrófono
   */
  checkMicrophonePermission(): Promise<boolean>;

  /**
   * Inicia el reconocimiento de voz
   */
  startSpeechRecognition(): Promise<void>;

  /**
   * Detiene el reconocimiento de voz
   */
  stopSpeechRecognition(): void;

  /**
   * Inicia la síntesis de voz para leer un texto
   */
  speakText(text: string): Promise<void>;

  /**
   * Detiene la síntesis de voz
   */
  stopSpeaking(): void;

  /**
   * Verifica si el asistente está hablando
   */
  isSpeaking(): boolean;

  /**
   * Resetea el estado de procesamiento para permitir nuevos resultados
   */
  resetProcessingState(): void;

  /**
   * Verifica si el navegador soporta la Web Speech API
   */
  isSpeechSupported(): boolean;

  /**
   * Obtiene el estado actual del reconocimiento de voz
   */
  getRecognitionState(): 'inactive' | 'listening' | 'processing';

  /**
   * Eventos para manejar el reconocimiento de voz
   */
  onSpeechResult(callback: (text: string) => void): void;
  onSpeechError(callback: (error: string) => void): void;
  onSpeechEnd(callback: () => void): void;
  onSilenceTimeout(callback: () => void): void;

  /**
   * Limpia completamente el reconocimiento de voz
   */
  cleanupSpeechRecognition(): void;

  /**
   * Reinicializa el reconocimiento de voz después de una limpieza
   */
  reinitializeSpeechRecognition(): void;

  /**
   * Método de debug para verificar el estado completo
   */
  debugState(): void;
}

export const VOICE_SERVICE_PORT = new InjectionToken<VoiceServicePort>('VoiceServicePort'); 