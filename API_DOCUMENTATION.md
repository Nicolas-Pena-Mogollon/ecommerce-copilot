# API Documentation - IndraShop Chat & Popups

## 📋 Información Mínima Requerida para el Endpoint

### **Endpoint Base**
```
POST http://localhost:8000/chat
```

### **Headers**
```
Content-Type: application/json
```

---

## 📤 **Payload Mínimo (Request)**

### **Estructura Completa:**
```json
{
  "userInput": "string",
  "uiContext": {
    "view": "string",
    "cartItems": [],
    "visibleProducts": [],
    "currentFilters": {},
    "searchTerm": "string",
    "pageHtml": "string",
    "timestamp": "string",
    "availableTargets": {
      "products": ["product", "product_button"],
      "navigation": ["search", "search_button", "clear_search", "cart", "home"],
      "filters": ["filter_panel", "category_filter", "price_filter", "discount_filter", "stock_filter", "clear_filters"]
    }
  }
}
```

---

## 📥 **Response Mínimo**

### **Estructura General (Siempre igual):**
```json
{
  "response": "string",
  "popup": {
    "type": "info|guide-step",
    "target": "CLAVE_GENERAL",
    "title": "string",
    "message": "string",
    "targetInfo": {
      "ID": "valor_específico"
    }
  }
}
```

---

## 🎯 **Tipos de Popup Disponibles**

### **1. `info`**
- **Uso**: Para mostrar información
- **Duración**: 5 segundos automática
- **Posición**: Derecha del elemento por defecto

### **2. `guide-step`**
- **Uso**: Para guiar al usuario paso a paso
- **Duración**: Manual (hasta que se cierre)
- **Posición**: Debajo del elemento por defecto

---

## 🔑 **Sistema de Targets Clave**

### **Productos:**
- `target: "product"` - Cualquier producto
- `target: "product_button"` - Botón de producto (agregar al carrito, etc.)

### **Navegación:**
- `target: "search"` - Campo de búsqueda
- `target: "search_button"` - Botón de búsqueda
- `target: "clear_search"` - Botón limpiar búsqueda
- `target: "cart"` - Icono del carrito
- `target: "home"` - Logo/navegación home

### **Filtros:**
- `target: "filter_panel"` - Panel de filtros completo
- `target: "category_filter"` - Filtro de categoría
- `target: "price_filter"` - Filtro de precio
- `target: "discount_filter"` - Filtro de descuento
- `target: "stock_filter"` - Filtro de stock
- `target: "clear_filters"` - Botón limpiar filtros

---

## 📝 **Ejemplos de Respuesta**

### **Ejemplo 1: Producto Específico**
```json
{
  "response": "Te muestro información sobre las camisetas",
  "popup": {
    "type": "info",
    "target": "product",
    "title": "Camiseta de Algodón",
    "message": "Producto de alta calidad con descuento del 20%",
    "targetInfo": {
      "ID": 1
    }
  }
}
```

### **Ejemplo 2: Botón de Producto**
```json
{
  "response": "Haz clic aquí para agregar al carrito",
  "popup": {
    "type": "guide-step",
    "target": "product_button",
    "title": "Agregar al Carrito",
    "message": "Haz clic en este botón para agregar el producto",
    "targetInfo": {
      "ID": 1
    }
  }
}
```

### **Ejemplo 3: Campo de Búsqueda**
```json
{
  "response": "Escribe aquí lo que buscas",
  "popup": {
    "type": "guide-step",
    "target": "search",
    "title": "Buscar Productos",
    "message": "Escribe el nombre del producto que quieres encontrar",
    "targetInfo": {
      "ID": "search_input"
    }
  }
}
```

### **Ejemplo 4: Filtro de Categoría**
```json
{
  "response": "Selecciona una categoría",
  "popup": {
    "type": "guide-step",
    "target": "category_filter",
    "title": "Filtrar por Categoría",
    "message": "Selecciona una categoría específica",
    "targetInfo": {
      "ID": "category_select"
    }
  }
}
```

### **Ejemplo 5: Carrito**
```json
{
  "response": "Aquí puedes ver tu carrito",
  "popup": {
    "type": "info",
    "target": "cart",
    "title": "Tu Carrito",
    "message": "Haz clic para ver los productos en tu carrito",
    "targetInfo": {
      "ID": "cart_icon"
    }
  }
}
```

---

## 🎯 **Uso de Targets Clave desde el Contexto**

### **Información Disponible en `uiContext.availableTargets`:**

Cuando escribes "hola" en el chat, el JSON de contexto incluye todos los targets clave disponibles:

```json
{
  "availableTargets": {
    "products": ["product", "product_button"],
    "navigation": ["search", "search_button", "clear_search", "cart", "home"],
    "filters": ["filter_panel", "category_filter", "price_filter", "discount_filter", "stock_filter", "clear_filters"]
  }
}
```

### **Cómo Usar los Targets Clave:**

1. **Revisa el contexto** cuando el usuario escribe "hola"
2. **Selecciona el target apropiado** de `availableTargets`
3. **Construye el popup** usando el target seleccionado
4. **Agrega información específica** en `targetInfo.ID` si es necesario

### **Ejemplo de Flujo:**

```json
// 1. Usuario escribe "hola" → Obtienes el contexto completo
// 2. Decides mostrar un popup en el carrito
// 3. Construyes la respuesta:

{
  "response": "Aquí puedes ver tu carrito de compras",
  "popup": {
    "type": "info",
    "target": "cart",  // ← Usando un target de availableTargets.navigation
    "title": "Tu Carrito",
    "message": "Haz clic para ver los productos en tu carrito",
    "targetInfo": {
      "ID": "cart_icon"
    }
  }
}
```

---

## 🚀 **Implementación Mínima**

### **Python (FastAPI):**
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    userInput: str
    uiContext: dict

class ChatResponse(BaseModel):
    response: str
    popup: dict = None

@app.post("/chat")
async def chat(request: ChatRequest):
    # Tu lógica de IA aquí
    return ChatResponse(
        response="Respuesta del asistente",
        popup={
            "type": "info",
            "target": "product",
            "title": "Producto",
            "message": "Información del producto",
            "targetInfo": {
                "ID": 1
            }
        }
    )
```

¡Con esta estructura simple y general, tu API puede generar popups para cualquier componente! 🎉 