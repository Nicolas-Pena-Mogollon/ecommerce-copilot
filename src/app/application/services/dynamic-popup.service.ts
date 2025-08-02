import { Injectable, ComponentFactoryResolver, ViewContainerRef, ComponentRef, Type } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PopupConfig {
  id: string;
  target: string; // Selector del elemento objetivo
  content: PopupContent;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  duration?: number; // Duración en ms, undefined = manual close
  style?: PopupStyle;
  actions?: PopupAction[];
}

export interface PopupContent {
  type: 'text' | 'html' | 'component' | 'product-info' | 'guide-step';
  title?: string;
  message?: string;
  html?: string;
  data?: any;
}

export interface PopupStyle {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  maxWidth?: string;
  zIndex?: number;
}

export interface PopupAction {
  label: string;
  action: 'close' | 'navigate' | 'filter' | 'highlight' | 'custom';
  data?: any;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface PopupInstance {
  id: string;
  componentRef: ComponentRef<any>;
  config: PopupConfig;
  element: HTMLElement;
}

@Injectable({
  providedIn: 'root'
})
export class DynamicPopupService {
  private activePopups = new Map<string, PopupInstance>();
  private popupSubject = new BehaviorSubject<PopupInstance[]>([]);

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  /**
   * Crea un popup dinámico
   */
  createPopup(config: PopupConfig): PopupInstance | null {
    try {
      // Encontrar el elemento objetivo
      const targetElement = document.querySelector(config.target);
      if (!targetElement) {
        console.error(`Target element not found: ${config.target}`);
        return null;
      }

      // Crear el elemento del popup
      const popupElement = this.createPopupElement(config);
      
      // Posicionar el popup
      this.positionPopup(popupElement, targetElement, config.position);
      
      // Agregar al DOM
      document.body.appendChild(popupElement);
      
      // Crear instancia
      const popupInstance: PopupInstance = {
        id: config.id,
        componentRef: null as any,
        config,
        element: popupElement
      };
      
      // Guardar referencia
      this.activePopups.set(config.id, popupInstance);
      this.popupSubject.next(Array.from(this.activePopups.values()));
      
      // Auto-cerrar si tiene duración
      if (config.duration) {
        setTimeout(() => this.closePopup(config.id), config.duration);
      }
      
      return popupInstance;
    } catch (error) {
      console.error('Error creating popup:', error);
      return null;
    }
  }

  /**
   * Crea el elemento HTML del popup
   */
  private createPopupElement(config: PopupConfig): HTMLElement {
    const popup = document.createElement('div');
    popup.className = 'dynamic-popup';
    popup.id = `popup-${config.id}`;
    
    // Aplicar estilos
    const styles = this.getPopupStyles(config.style);
    Object.assign(popup.style, styles);
    
    // Crear contenido
    const content = this.createPopupContent(config.content);
    popup.innerHTML = content;
    
    // Agregar botón de cerrar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'popup-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.closePopup(config.id);
    popup.appendChild(closeBtn);
    
    // Agregar acciones si existen
    if (config.actions && config.actions.length > 0) {
      const actionsContainer = this.createActionsContainer(config.actions, config.id);
      popup.appendChild(actionsContainer);
    }
    
    return popup;
  }

  /**
   * Crea el contenido del popup
   */
  private createPopupContent(content: PopupContent): string {
    switch (content.type) {
      case 'text':
        return `
          <div class="popup-content">
            ${content.title ? `<h3 class="popup-title">${content.title}</h3>` : ''}
            <p class="popup-message">${content.message || ''}</p>
          </div>
        `;
      
      case 'html':
        return `
          <div class="popup-content">
            ${content.html || ''}
          </div>
        `;
      
      case 'product-info':
        return `
          <div class="popup-content product-info">
            <h3 class="popup-title">${content.data?.name || 'Producto'}</h3>
            <div class="product-details">
              <p class="price">$${content.data?.price?.toLocaleString() || '0'}</p>
              <p class="description">${content.data?.description || ''}</p>
              <button class="add-to-cart-btn" onclick="this.addToCart('${content.data?.id}')">
                Agregar al carrito
              </button>
            </div>
          </div>
        `;
      
      case 'guide-step':
        return `
          <div class="popup-content guide-step">
            <div class="step-number">${content.data?.step || 1}</div>
            <h3 class="popup-title">${content.title || 'Paso'}</h3>
            <p class="popup-message">${content.message || ''}</p>
          </div>
        `;
      
      default:
        return `
          <div class="popup-content">
            <p class="popup-message">${content.message || 'Contenido no disponible'}</p>
          </div>
        `;
    }
  }

  /**
   * Crea el contenedor de acciones
   */
  private createActionsContainer(actions: PopupAction[], popupId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'popup-actions';
    
    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = `popup-action-btn ${action.style || 'secondary'}`;
      button.textContent = action.label;
      button.onclick = () => this.executeAction(action, popupId);
      container.appendChild(button);
    });
    
    return container;
  }

  /**
   * Ejecuta una acción del popup
   */
  private executeAction(action: PopupAction, popupId: string): void {
    switch (action.action) {
      case 'close':
        this.closePopup(popupId);
        break;
      case 'navigate':
        // Implementar navegación
        console.log('Navigate to:', action.data);
        break;
      case 'filter':
        // Implementar filtrado
        console.log('Apply filter:', action.data);
        break;
      case 'highlight':
        // Implementar resaltado
        console.log('Highlight element:', action.data);
        break;
      case 'custom':
        // Acción personalizada
        console.log('Custom action:', action.data);
        break;
    }
  }

  /**
   * Posiciona el popup relativo al elemento objetivo
   */
  private positionPopup(popup: HTMLElement, target: Element, position: string): void {
    const targetRect = target.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        // Posicionar encima del elemento con un pequeño espacio
        top = targetRect.top + scrollTop - popupRect.height - 8;
        left = targetRect.left + scrollLeft + (targetRect.width - popupRect.width) / 2;
        break;
        
      case 'bottom':
        // Posicionar debajo del elemento con un pequeño espacio
        top = targetRect.bottom + scrollTop + 8;
        left = targetRect.left + scrollLeft + (targetRect.width - popupRect.width) / 2;
        break;
        
      case 'left':
        // Posicionar a la izquierda del elemento
        top = targetRect.top + scrollTop + (targetRect.height - popupRect.height) / 2;
        left = targetRect.left + scrollLeft - popupRect.width - 8;
        break;
        
      case 'right':
        // Posicionar a la derecha del elemento
        top = targetRect.top + scrollTop + (targetRect.height - popupRect.height) / 2;
        left = targetRect.right + scrollLeft + 8;
        break;
        
      case 'center':
        // Centrar en la pantalla
        top = window.innerHeight / 2 - popupRect.height / 2 + scrollTop;
        left = window.innerWidth / 2 - popupRect.width / 2 + scrollLeft;
        break;
    }
    
    // Asegurar que el popup no se salga de la pantalla
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Ajustar horizontalmente si se sale de la pantalla
    if (left < 10) left = 10;
    if (left + popupRect.width > viewportWidth - 10) {
      left = viewportWidth - popupRect.width - 10;
    }
    
    // Ajustar verticalmente si se sale de la pantalla
    if (top < 10) top = 10;
    if (top + popupRect.height > viewportHeight - 10) {
      top = viewportHeight - popupRect.height - 10;
    }
    
    // Aplicar posición
    popup.style.position = 'absolute';
    popup.style.top = `${Math.max(0, top)}px`;
    popup.style.left = `${Math.max(0, left)}px`;
    
    // Agregar flecha indicadora si es necesario
    this.addArrowIndicator(popup, position, targetRect, popupRect);
  }

  /**
   * Agrega una flecha indicadora al popup
   */
  private addArrowIndicator(popup: HTMLElement, position: string, targetRect: DOMRect, popupRect: DOMRect): void {
    const arrow = document.createElement('div');
    arrow.className = 'popup-arrow';
    
    let arrowStyle = '';
    
    switch (position) {
      case 'top':
        arrowStyle = `
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid ${this.getBorderColor(popup)};
        `;
        break;
        
      case 'bottom':
        arrowStyle = `
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid ${this.getBorderColor(popup)};
        `;
        break;
        
      case 'left':
        arrowStyle = `
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 8px solid ${this.getBorderColor(popup)};
        `;
        break;
        
      case 'right':
        arrowStyle = `
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid ${this.getBorderColor(popup)};
        `;
        break;
    }
    
    if (arrowStyle) {
      arrow.style.cssText = arrowStyle;
      popup.appendChild(arrow);
    }
  }

  /**
   * Obtiene el color del borde del popup
   */
  private getBorderColor(popup: HTMLElement): string {
    const computedStyle = window.getComputedStyle(popup);
    return computedStyle.borderColor || '#3498db';
  }

  /**
   * Obtiene los estilos del popup
   */
  private getPopupStyles(style?: PopupStyle): any {
    return {
      backgroundColor: style?.backgroundColor || '#ffffff',
      color: style?.color || '#333333',
      border: `2px solid ${style?.borderColor || '#3498db'}`,
      borderRadius: style?.borderRadius || '8px',
      boxShadow: style?.boxShadow || '0 4px 20px rgba(0, 0, 0, 0.15)',
      maxWidth: style?.maxWidth || '300px',
      zIndex: style?.zIndex || '9999',
      padding: '16px',
      position: 'fixed',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    };
  }

  /**
   * Cierra un popup específico
   */
  closePopup(id: string): void {
    const popup = this.activePopups.get(id);
    if (popup) {
      popup.element.remove();
      this.activePopups.delete(id);
      this.popupSubject.next(Array.from(this.activePopups.values()));
    }
  }

  /**
   * Cierra todos los popups
   */
  closeAllPopups(): void {
    this.activePopups.forEach(popup => {
      popup.element.remove();
    });
    this.activePopups.clear();
    this.popupSubject.next([]);
  }

  /**
   * Obtiene los popups activos como Observable
   */
  getActivePopups$(): Observable<PopupInstance[]> {
    return this.popupSubject.asObservable();
  }

  /**
   * Crea un popup desde la respuesta del API
   */
  createPopupFromApiResponse(apiResponse: any): PopupInstance | null {
    console.log('createPopupFromApiResponse called with:', apiResponse);
    
    if (!apiResponse?.popup) {
      console.warn('No popup configuration found in API response');
      return null;
    }

    const popup = apiResponse.popup;
    console.log('Processing popup config:', popup);
    
    // Generar selector específico basado en el target clave
    const targetSelector = this.generateSpecificSelector(popup.target, popup.targetInfo);
    console.log('Generated target selector:', targetSelector);
    
    // Verificar si el elemento existe
    const targetElement = document.querySelector(targetSelector);
    console.log('Target element found:', targetElement);
    
    if (!targetElement) {
      console.error(`Target element not found for selector: ${targetSelector}`);
      console.log('Available elements:', {
        products: document.querySelectorAll('.product-card').length,
        searchInputs: document.querySelectorAll('[data-input="search"]').length,
        cartIcons: document.querySelectorAll('[data-nav="cart"]').length,
        filters: document.querySelectorAll('[data-filter-panel="main"]').length
      });
      return null;
    }
    
    // Configuración automática según el tipo
    let config: PopupConfig;
    
    if (popup.type === 'guide-step') {
      // Popup de guía paso a paso - dura hasta que se cierre manualmente
      config = {
        id: `guide-${Date.now()}`,
        target: targetSelector,
        content: {
          type: 'guide-step',
          title: popup.title,
          message: popup.message
        },
        position: 'bottom', // Por defecto debajo del elemento
        duration: undefined, // Sin duración automática
        style: {
          backgroundColor: '#e8f4fd',
          borderColor: '#3498db',
          maxWidth: '320px'
        },
        actions: [
          {
            label: 'Siguiente',
            action: 'custom',
            style: 'primary'
          },
          {
            label: 'Cerrar',
            action: 'close',
            style: 'secondary'
          }
        ]
      };
    } else if (popup.type === 'info') {
      // Popup de información - dura 5 segundos
      config = {
        id: `info-${Date.now()}`,
        target: targetSelector,
        content: {
          type: 'text',
          title: popup.title,
          message: popup.message
        },
        position: 'right', // Por defecto a la derecha del elemento
        duration: 5000, // 5 segundos
        style: {
          backgroundColor: '#f8f9fa',
          borderColor: '#3498db',
          maxWidth: '280px'
        },
        actions: [
          {
            label: 'Cerrar',
            action: 'close',
            style: 'secondary'
          }
        ]
      };
    } else {
      console.error('Tipo de popup no reconocido:', popup.type);
      return null;
    }

    console.log('Created popup config:', config);
    const result = this.createPopup(config);
    console.log('Popup creation result:', result);
    return result;
  }

  /**
   * Genera un selector específico basado en el target clave
   */
  private generateSpecificSelector(target: string, targetInfo?: any): string {
    console.log('Generating selector for target:', target, 'with info:', targetInfo);

    switch (target) {
      // Productos
      case 'product':
        if (targetInfo?.ID) {
          return `[data-product-id="${targetInfo.ID}"]`;
        }
        return '.product-card:first-child';
      
      case 'product_button':
        if (targetInfo?.ID) {
          return `[data-product-id="${targetInfo.ID}"][data-action="add-to-cart"]`;
        }
        return '[data-action="add-to-cart"]:first-child';
      
      // Navegación
      case 'search':
        return '[data-input="search"]';
      
      case 'search_button':
        return '[data-action="search-btn"]';
      
      case 'clear_search':
        return '[data-action="clear-search"]';
      
      case 'cart':
        return '[data-nav="cart"]';
      
      case 'home':
        return '[data-action="navigate-home"]';
      
      // Filtros
      case 'filter_panel':
        return '[data-filter-panel="main"]';
      
      case 'category_filter':
        return '[data-filter="category-select"]';
      
      case 'price_filter':
        return '[data-filter="price-min"]';
      
      case 'discount_filter':
        return '[data-filter="discount-checkbox"]';
      
      case 'stock_filter':
        return '[data-filter="stock-checkbox"]';
      
      case 'clear_filters':
        return '[data-action="clear-filters"]';
      
      default:
        console.warn('Target no reconocido:', target);
        return target;
    }
  }
} 