import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces para el payload del chat
export interface ChatPayload {
  userInput: string;
  uiContext: {
    view: string;
    cartItems: any[];
    visibleProducts: any[];
    currentFilters: any;
    searchTerm?: string;
    pageHtml: string;
  };
}

// Interfaces para el payload del chat escrito (sin HTML y sin agentType)
export interface WrittenChatPayload {
  userInput: string;
  uiContext: {
    view: string;
    cartItems: any[];
    visibleProducts: any[];
    currentFilters: any;
    searchTerm?: string;
    pageHtml: string;
  };
}

// Interfaces para la respuesta del chat
export interface ChatResponse {
  response: string;
  popup?: {
    type: 'guide-step' | 'info';
    target: string;
    title: string;
    message: string;
    // Información adicional para selección específica
    targetInfo?: {
      productId?: string;
      productName?: string;
      filterType?: 'category' | 'price' | 'discount' | 'stock';
      filterValue?: string;
      elementIndex?: number;
    };
  };
  steps?: Array<{
    type: 'guide-step';
    target: string;
    title: string;
    message: string;
    targetInfo?: {
      ID?: number;
      productId?: string;
      productName?: string;
      filterType?: 'category' | 'price' | 'discount' | 'stock';
      filterValue?: string;
      elementIndex?: number;
    };
  }>;
}

// Interfaces para vision (mantener compatibilidad)
export interface VisionPayload {
  message: string;
  image: File;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000';
  private backendUrl = 'https://ecommerce-copilot-backend.onrender.com';

  constructor(private http: HttpClient) {}

  /**
   * Envía un mensaje de texto al API de chat
   */
  sendTextMessage(payload: ChatPayload): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, payload);
  }

  /**
   * Envía el contexto del chat al backend (sin HTML y sin agentType)
   */
  sendWrittenChatContext(payload: WrittenChatPayload): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.backendUrl}/chat`, payload);
  }

  /**
   * Envía un mensaje con imagen al API de vision
   */
  sendVisionMessage(message: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('image', image);
    return this.http.post<any>(`${this.baseUrl}/vision`, formData);
  }

  /**
   * Obtiene productos recomendados
   */
  getRecommendedProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/recommend`);
  }

  /**
   * Obtiene productos recomendados por contexto
   */
  getRecommendedProductsByContext(context: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/recommend`, context);
  }

  /**
   * Hace un GET request a un endpoint específico
   */
  getDynamicEndpoint(path: string): Observable<any> {
    return this.http.get(`https://b4ef0988-6907-47d8-8556-bf6b385b5b7f.mock.pstmn.io/${path}`);
  }
} 