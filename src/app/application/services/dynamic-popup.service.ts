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
  steps?: PopupStep[]; // Nuevo: array de pasos para popups secuenciales
  currentStep?: number; // Nuevo: paso actual
}

export interface PopupStep {
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
  action: 'close' | 'navigate' | 'filter' | 'highlight' | 'custom' | 'next' | 'previous';
  data?: any;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface PopupInstance {
  id: string;
  componentRef: ComponentRef<any>;
  config: PopupConfig;
  element: HTMLElement;
  currentStep?: number; // Nuevo: paso actual
  totalSteps?: number; // Nuevo: total de pasos
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
      
      // Ocultar el popup inicialmente
      popupElement.style.opacity = '0';
      popupElement.style.visibility = 'hidden';
      
      // Agregar al DOM primero (sin posicionar)
      document.body.appendChild(popupElement);
      
      // Hacer scroll hacia el target y luego posicionar el popup
      this.scrollToTargetAndPositionPopup(popupElement, targetElement, config.position);
      
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
      case 'next':
        this.nextStep(popupId);
        break;
      case 'previous':
        this.previousStep(popupId);
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
    // Obtener las dimensiones del popup antes de posicionarlo
    const popupRect = popup.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    console.log('Positioning popup:', {
      targetRect: {
        top: targetRect.top,
        bottom: targetRect.bottom,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height
      },
      popupRect: {
        width: popupRect.width,
        height: popupRect.height
      },
      scrollTop: scrollTop,
      position: position
    });
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        // Posicionar encima del elemento con un pequeño espacio
        top = targetRect.top - popupRect.height - 12;
        left = targetRect.left + (targetRect.width - popupRect.width) / 2;
        break;
        
      case 'bottom':
        // Posicionar debajo del elemento con un pequeño espacio
        top = targetRect.bottom + 12;
        left = targetRect.left + (targetRect.width - popupRect.width) / 2;
        break;
        
      case 'left':
        // Posicionar a la izquierda del elemento
        top = targetRect.top + (targetRect.height - popupRect.height) / 2;
        left = targetRect.left - popupRect.width - 12;
        break;
        
      case 'right':
        // Posicionar a la derecha del elemento
        top = targetRect.top + (targetRect.height - popupRect.height) / 2;
        left = targetRect.right + 12;
        break;
        
      case 'center':
        // Centrar en la pantalla
        top = window.innerHeight / 2 - popupRect.height / 2;
        left = window.innerWidth / 2 - popupRect.width / 2;
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
    
    console.log('Calculated popup position:', { top, left });
    
    // Aplicar posición
    popup.style.position = 'fixed';
    popup.style.top = `${Math.max(0, top)}px`;
    popup.style.left = `${Math.max(0, left)}px`;
    
    // Agregar flecha indicadora si es necesario
    this.addArrowIndicator(popup, position, targetRect, popupRect);
    
    console.log('Popup positioned successfully');
  }

  /**
   * Hace scroll hacia el target y luego posiciona el popup
   */
  private scrollToTargetAndPositionPopup(popup: HTMLElement, target: Element, position: string): void {
    const targetRect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Calcular la posición absoluta del target
    const targetTop = targetRect.top + scrollTop;
    const targetLeft = targetRect.left + scrollLeft;
    
    // Verificar si el elemento ya está visible en el viewport
    const isElementVisible = this.isElementInViewport(targetRect.top, targetRect.bottom, targetRect.left, targetRect.right);
    
    if (isElementVisible) {
      // Si el elemento ya está visible, posicionar el popup inmediatamente
      console.log('Element already visible, positioning popup immediately');
      this.positionPopup(popup, target, position);
      popup.style.opacity = '1';
      popup.style.visibility = 'visible';
      popup.style.transition = 'opacity 0.3s ease';
      return;
    }
    
    // Hacer scroll hacia la posición del target
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let targetScrollTop = scrollTop;
    let targetScrollLeft = scrollLeft;
    
    // Ajustar scroll vertical para centrar el target en la vista
    if (position === 'bottom') {
      // Para popup abajo, hacer scroll para que el target esté visible arriba
      targetScrollTop = targetTop - 150; // Reducir margen superior para scroll más rápido
    } else if (position === 'top') {
      // Para popup arriba, hacer scroll para que el target esté visible abajo
      targetScrollTop = targetTop + targetRect.height - viewportHeight + 150; // Reducir margen inferior
    } else {
      // Para otras posiciones, centrar el target
      targetScrollTop = targetTop - (viewportHeight / 2) + (targetRect.height / 2);
    }
    
    // Asegurar que el scroll no sea negativo
    targetScrollTop = Math.max(0, targetScrollTop);
    
    console.log('Scrolling to target:', {
      currentScroll: scrollTop,
      targetScroll: targetScrollTop,
      targetTop: targetTop,
      position: position
    });
    
    // Realizar el scroll suave
    this.smoothScrollTo(targetScrollTop, targetScrollLeft);
    
    // Posicionar el popup después del scroll con un enfoque más directo
    setTimeout(() => {
      console.log('Positioning popup after scroll');
      this.positionPopup(popup, target, position);
      
      // Mostrar el popup inmediatamente después de posicionarlo
      popup.style.opacity = '1';
      popup.style.visibility = 'visible';
      popup.style.transition = 'opacity 0.3s ease';
      
      // Verificar que el popup esté visible y reposicionar si es necesario
      setTimeout(() => {
        const popupRect = popup.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        
        console.log('Popup positioned at:', {
          top: popupRect.top,
          left: popupRect.left,
          visible: popupRect.top > 0 && popupRect.left > 0
        });
        
        // Verificar si el popup está en la posición correcta y reposicionar si es necesario
        if (position === 'bottom' && popupRect.top < targetRect.bottom + 50) {
          console.log('Repositioning popup - too close to target');
          this.positionPopup(popup, target, position);
        }
      }, 100);
    }, 300); // Reducir aún más el tiempo de espera
  }



  /**
   * Verifica si un elemento está en el viewport
   */
  private isElementInViewport(top: number, bottom: number, left: number, right: number): boolean {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    return top >= 0 && bottom <= viewportHeight && left >= 0 && right <= viewportWidth;
  }

  /**
   * Realiza scroll suave a la posición especificada
   */
  private smoothScrollTo(targetScrollTop: number, targetScrollLeft: number): void {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const currentScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    const scrollDiffTop = targetScrollTop - currentScrollTop;
    const scrollDiffLeft = targetScrollLeft - currentScrollLeft;
    
    // Hacer scroll si hay una diferencia significativa (más de 10px)
    if (Math.abs(scrollDiffTop) > 10 || Math.abs(scrollDiffLeft) > 10) {
      console.log('Scrolling to popup:', {
        current: { top: currentScrollTop, left: currentScrollLeft },
        target: { top: targetScrollTop, left: targetScrollLeft },
        diff: { top: scrollDiffTop, left: scrollDiffLeft }
      });
      
      // Agregar clase de scrolling
      document.documentElement.classList.add('scrolling');
      document.body.classList.add('scrolling');
      
      window.scrollTo({
        top: targetScrollTop,
        left: targetScrollLeft,
        behavior: 'smooth'
      });
      
      // Remover clase de scrolling después de un tiempo
      setTimeout(() => {
        document.documentElement.classList.remove('scrolling');
        document.body.classList.remove('scrolling');
      }, 1000);
    }
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
      position: 'absolute',
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
    console.log('=== createPopupFromApiResponse called ===');
    console.log('Full API response:', apiResponse);
    console.log('Has popup:', !!apiResponse?.popup);
    console.log('Has steps:', !!apiResponse?.steps);
    console.log('Steps array:', apiResponse?.steps);
    
    // Verificar si es un popup con pasos
    if (apiResponse?.steps && Array.isArray(apiResponse.steps) && apiResponse.steps.length > 0) {
      console.log('Creating step popup...');
      return this.createStepPopup(apiResponse);
    }
    
    // Verificar si es un popup simple
    if (!apiResponse?.popup) {
      console.warn('No popup configuration found in API response');
      return null;
    }

    console.log('Creating simple popup...');
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
      // Popup de información - verificar si es para localizar un producto
      if (popup.target === 'product' && popup.targetInfo?.ID) {
        // Es un popup para localizar un producto - posicionarlo debajo del producto
        config = {
          id: `info-${Date.now()}`,
          target: targetSelector,
          content: {
            type: 'text',
            title: popup.title,
            message: popup.message
          },
          position: 'bottom', // Posicionar debajo del producto
          duration: 5000, // 5 segundos
          style: {
            backgroundColor: '#f8f9fa',
            borderColor: '#3498db',
            maxWidth: '280px',
            zIndex: 10000
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
        // Popup de información normal - dura 5 segundos
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
      }
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
   * Crea un popup con pasos secuenciales
   */
  private createStepPopup(apiResponse: any): PopupInstance | null {
    console.log('Creating step popup with steps:', apiResponse.steps);
    
    const steps = apiResponse.steps;
    const currentStep = 0; // Empezar en el primer paso
    
    // Obtener el primer paso
    const firstStep = steps[currentStep];
    if (!firstStep) {
      console.error('No steps found in API response');
      return null;
    }
    
    console.log('First step:', firstStep);
    
    // Generar selector para el primer paso
    const targetSelector = this.generateSpecificSelector(firstStep.target, firstStep.targetInfo);
    console.log('Generated target selector for first step:', targetSelector);
    
    // Verificar si el elemento existe
    const targetElement = document.querySelector(targetSelector);
    console.log('Target element found:', targetElement);
    
    if (!targetElement) {
      console.error(`Target element not found for first step: ${targetSelector}`);
      
      // Debug: mostrar todos los elementos disponibles
      console.log('Available elements for debugging:');
      console.log('Products with data-product-id:', document.querySelectorAll('[data-product-id]').length);
      console.log('Products with data-action="add-to-cart":', document.querySelectorAll('[data-action="add-to-cart"]').length);
      console.log('Cart elements:', document.querySelectorAll('[data-nav="cart"]').length);
      console.log('All product cards:', document.querySelectorAll('.product-card').length);
      
      // Mostrar detalles de los elementos encontrados
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach((card, index) => {
        console.log(`Product card ${index}:`, {
          id: card.getAttribute('data-product-id'),
          name: card.getAttribute('data-product-name'),
          classList: card.classList.toString()
        });
      });
      
      const cartElements = document.querySelectorAll('[data-nav="cart"]');
      cartElements.forEach((cart, index) => {
        console.log(`Cart element ${index}:`, {
          nav: cart.getAttribute('data-nav'),
          action: cart.getAttribute('data-action'),
          classList: cart.classList.toString()
        });
      });
      
      return null;
    }
    
    // Crear configuración del popup con pasos
    const config: PopupConfig = {
      id: `step-guide-${Date.now()}`,
      target: targetSelector,
      content: {
        type: 'guide-step',
        title: firstStep.title,
        message: firstStep.message,
        data: { step: currentStep + 1, total: steps.length }
      },
      position: 'bottom',
      duration: undefined, // Sin duración automática
      style: {
        backgroundColor: '#e8f4fd',
        borderColor: '#3498db',
        maxWidth: '320px'
      },
      steps: steps,
      currentStep: currentStep,
      actions: this.generateStepActions(currentStep, steps.length)
    };
    
    console.log('Created step popup config:', config);
    const result = this.createPopup(config);
    console.log('Popup creation result:', result);
    
    if (result) {
      // Agregar información de pasos a la instancia
      result.currentStep = currentStep;
      result.totalSteps = steps.length;
    }
    
    return result;
  }

  /**
   * Genera las acciones para un popup con pasos
   */
  private generateStepActions(currentStep: number, totalSteps: number): PopupAction[] {
    const actions: PopupAction[] = [];
    
    // Botón anterior (solo si no es el primer paso)
    if (currentStep > 0) {
      actions.push({
        label: 'Anterior',
        action: 'previous',
        style: 'secondary'
      });
    }
    
    // Botón siguiente o finalizar
    if (currentStep < totalSteps - 1) {
      actions.push({
        label: 'Siguiente',
        action: 'next',
        style: 'primary'
      });
    } else {
      actions.push({
        label: 'Finalizar',
        action: 'close',
        style: 'primary'
      });
    }
    
    // Botón cerrar (siempre disponible)
    actions.push({
      label: 'Cerrar',
      action: 'close',
      style: 'secondary'
    });
    
    return actions;
  }

  /**
   * Avanza al siguiente paso del popup
   */
  nextStep(popupId: string): void {
    const popup = this.activePopups.get(popupId);
    if (!popup || !popup.config.steps || popup.currentStep === undefined) {
      console.error('Popup not found or not a step popup');
      return;
    }
    
    const nextStepIndex = (popup.currentStep || 0) + 1;
    if (nextStepIndex >= popup.config.steps.length) {
      console.log('Already at last step, closing popup');
      this.closePopup(popupId);
      return;
    }
    
    this.goToStep(popupId, nextStepIndex);
  }

  /**
   * Retrocede al paso anterior del popup
   */
  previousStep(popupId: string): void {
    const popup = this.activePopups.get(popupId);
    if (!popup || !popup.config.steps || popup.currentStep === undefined) {
      console.error('Popup not found or not a step popup');
      return;
    }
    
    const previousStepIndex = (popup.currentStep || 0) - 1;
    if (previousStepIndex < 0) {
      console.log('Already at first step');
      return;
    }
    
    this.goToStep(popupId, previousStepIndex);
  }

  /**
   * Va a un paso específico del popup
   */
  private goToStep(popupId: string, stepIndex: number): void {
    const popup = this.activePopups.get(popupId);
    if (!popup || !popup.config.steps) {
      console.error('Popup not found or not a step popup');
      return;
    }
    
    const step = popup.config.steps[stepIndex];
    if (!step) {
      console.error('Step not found at index:', stepIndex);
      return;
    }
    
    // Generar selector para el nuevo paso
    const targetSelector = this.generateSpecificSelector(step.target, step.targetInfo);
    const targetElement = document.querySelector(targetSelector);
    
    if (!targetElement) {
      console.error(`Target element not found for step ${stepIndex}: ${targetSelector}`);
      return;
    }
    
    // Actualizar el contenido del popup
    this.updatePopupContent(popup, step, stepIndex, popup.config.steps.length);
    
    // Reposicionar el popup
    this.positionPopup(popup.element, targetElement, popup.config.position);
    
    // Hacer scroll para que el popup sea visible (con pequeño delay para asegurar posicionamiento)
    setTimeout(() => {
      this.scrollToTargetAndPositionPopup(popup.element, targetElement, popup.config.position);
    }, 100);
    
    // Actualizar la instancia
    popup.currentStep = stepIndex;
    popup.config.currentStep = stepIndex;
    
    console.log(`Moved to step ${stepIndex + 1} of ${popup.config.steps.length}`);
  }

  /**
   * Actualiza el contenido del popup para un paso específico
   */
  private updatePopupContent(popup: PopupInstance, step: PopupStep, stepIndex: number, totalSteps: number): void {
    // Actualizar el contenido
    const contentContainer = popup.element.querySelector('.popup-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="popup-content guide-step">
          <div class="step-indicator">
            <span class="step-number">${stepIndex + 1}</span>
            <span class="step-separator">/</span>
            <span class="total-steps">${totalSteps}</span>
          </div>
          <h3 class="popup-title">${step.title}</h3>
          <p class="popup-message">${step.message}</p>
        </div>
      `;
    }
    
    // Actualizar las acciones
    const actionsContainer = popup.element.querySelector('.popup-actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      const newActions = this.generateStepActions(stepIndex, totalSteps);
      
      newActions.forEach(action => {
        const button = document.createElement('button');
        button.className = `popup-action-btn ${action.style || 'secondary'}`;
        button.textContent = action.label;
        button.onclick = () => this.executeStepAction(action, popup.id);
        actionsContainer.appendChild(button);
      });
    }
  }

  /**
   * Ejecuta una acción específica para popups con pasos
   */
  private executeStepAction(action: PopupAction, popupId: string): void {
    switch (action.action) {
      case 'next':
        this.nextStep(popupId);
        break;
      case 'previous':
        this.previousStep(popupId);
        break;
      case 'close':
        this.closePopup(popupId);
        break;
      default:
        this.executeAction(action, popupId);
    }
  }

  /**
   * Método de prueba para crear un popup con pasos
   */
  createTestStepPopup(): PopupInstance | null {
    const testResponse = {
      response: "Te guiaré paso a paso para agregar la Camiseta Básica de Algodón al carrito.",
      steps: [
        {
          type: "guide-step",
          target: "product",
          title: "Seleccionar producto",
          message: "Haz clic en el producto para ver sus detalles.",
          targetInfo: {
            ID: 1
          }
        },
        {
          type: "guide-step",
          target: "product_button",
          title: "Agregar al carrito",
          message: "Haz clic aquí para agregar el producto seleccionado al carrito.",
          targetInfo: {
            ID: 1
          }
        },
        {
          type: "guide-step",
          target: "cart",
          title: "Ir al carrito",
          message: "Haz clic en el ícono del carrito para revisar tu compra.",
          targetInfo: {
            ID: 1
          }
        }
      ]
    };

    console.log('Creating test step popup...');
    return this.createPopupFromApiResponse(testResponse);
  }

  /**
   * Método de prueba para crear un popup de información de producto
   */
  createTestProductInfoPopup(): PopupInstance | null {
    const testResponse = {
      response: "Aquí tienes la laptop.",
      popup: {
        type: "info",
        target: "product",
        title: "Laptop Dell Inspiron 15",
        message: "Este es el producto que coincide con tu búsqueda.",
        targetInfo: {
          ID: 5
        }
      }
    };

    console.log('Creating test product info popup...');
    return this.createPopupFromApiResponse(testResponse);
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
          console.log(`Looking for product with ID: ${targetInfo.ID}`);
          
          // Intentar múltiples selectores para encontrar el producto
          const selectors = [
            `[data-product-id="${targetInfo.ID}"]`,
            `.product-card[data-product-id="${targetInfo.ID}"]`,
            `[data-product-id="${targetInfo.ID}"].product-card`,
            // Buscar por índice (ID como índice)
            `.product-card:nth-child(${targetInfo.ID})`,
            // Buscar por índice + 1 (si los IDs empiezan en 1)
            `.product-card:nth-child(${targetInfo.ID + 1})`,
            // Buscar por índice - 1 (si los IDs empiezan en 0)
            `.product-card:nth-child(${targetInfo.ID - 1})`
          ];
          
          // Verificar cuál selector funciona
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              console.log(`Found product with selector: ${selector}`);
              return selector;
            }
          }
          
          // Si no se encuentra con selectores específicos, buscar en todos los productos
          const allProducts = document.querySelectorAll('.product-card');
          console.log(`Found ${allProducts.length} total products`);
          
          if (allProducts.length > 0) {
            // Usar el producto más cercano al ID especificado
            const targetIndex = Math.min(targetInfo.ID - 1, allProducts.length - 1);
            const targetProduct = allProducts[targetIndex];
            if (targetProduct) {
              console.log(`Using product at index ${targetIndex} for ID ${targetInfo.ID}`);
              return `.product-card:nth-child(${targetIndex + 1})`;
            }
          }
          
          console.warn(`No product found with ID ${targetInfo.ID}, using fallback`);
          return '.product-card:first-child';
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