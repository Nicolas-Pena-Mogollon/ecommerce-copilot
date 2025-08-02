# Funcionalidad Completa del Chat de Voz

## 🔄 Flujo de Funcionamiento

El chat de voz implementa un flujo completo que replica exactamente la funcionalidad del chat de texto pero usando voz:

### 1. **Activación del Micrófono**
- Usuario presiona el botón del micrófono
- Se activa el reconocimiento de voz
- El botón cambia a estado "Escuchando" (amarillo)

### 2. **Reconocimiento de Voz**
- El sistema escucha la voz del usuario
- Convierte automáticamente la voz a texto
- Muestra el texto reconocido en la interfaz

### 3. **Procesamiento del Mensaje**
- El texto reconocido se envía al **mismo endpoint** que el chat de texto
- Se usa la misma estructura de payload:
  ```typescript
  {
    userInput: "texto reconocido",
    uiContext: {
      // contexto de la UI sin HTML
      pageHtml: ''
    }
  }
  ```

### 4. **Respuesta del Servidor**
- **Si hay respuesta exitosa**: Se lee la respuesta en voz alta
- **Si no hay respuesta**: Se dice "Estamos teniendo problemas con el servicio. Intenta más tarde."
- **Si hay error de conexión**: Se dice "Estamos teniendo problemas con el servicio. Intenta más tarde."

### 5. **Manejo de Popups**
- Si la respuesta incluye popups o steps, se muestran automáticamente
- Igual que en el chat de texto

## 🎯 Características Implementadas

### ✅ **Conversión Voz a Texto**
- Reconocimiento automático de voz
- Visualización del texto reconocido
- Manejo de errores de reconocimiento

### ✅ **Integración con Backend**
- Usa el mismo endpoint: `sendWrittenChatContext`
- Misma estructura de datos que el chat de texto
- Mismo manejo de respuestas y popups

### ✅ **Síntesis de Voz**
- Lee las respuestas del servidor en voz alta
- Manejo de errores con mensajes de voz apropiados
- Posibilidad de interrumpir la lectura

### ✅ **Estados Visuales**
- **Listo**: Verde - Esperando activación
- **Escuchando**: Amarillo - Reconociendo voz
- **Procesando**: Azul - Enviando al servidor
- **Respondiendo**: Púrpura - Leyendo respuesta

### ✅ **Manejo de Errores**
- **Sin respuesta del servidor**: "Estamos teniendo problemas con el servicio. Intenta más tarde."
- **Error de conexión**: "Estamos teniendo problemas con el servicio. Intenta más tarde."
- **Error de reconocimiento**: Mensaje específico del error

## 🔧 Arquitectura Técnica

### **Servicios Involucrados**

1. **VoiceAgentService** (Lógica de negocio)
   - Maneja el flujo completo de voz
   - Integra con el API service
   - Gestiona estados y errores

2. **WebSpeechService** (Adaptador de infraestructura)
   - Implementa la Web Speech API
   - Maneja reconocimiento y síntesis de voz
   - Gestiona permisos del navegador

3. **ApiService** (Comunicación con backend)
   - Mismo endpoint que el chat de texto
   - Misma estructura de datos
   - Mismo manejo de respuestas

4. **UiContextService** (Contexto de la UI)
   - Proporciona contexto de la página actual
   - Igual que en el chat de texto

### **Flujo de Datos**

```
Usuario habla → Reconocimiento → Texto → API Service → Backend → Respuesta → Síntesis de Voz
```

## 🎨 Interfaz de Usuario

### **Estados del Botón Principal**
- **Normal**: Azul con icono de micrófono
- **Escuchando**: Amarillo con animación de ondas
- **Procesando**: Azul con animación de rotación
- **Respondiendo**: Púrpura con icono de altavoz

### **Indicadores Visuales**
- **Punto de estado**: Cambia de color según el estado
- **Texto reconocido**: Se muestra en una tarjeta
- **Instrucciones**: Guían al usuario en cada paso

## 🚀 Funcionalidades Avanzadas

### **Gestión de Estados**
- Prevención de múltiples reconocimientos simultáneos
- Reset automático del estado de procesamiento
- Manejo de timeouts de silencio

### **Optimizaciones**
- Detención automática del reconocimiento al obtener resultado
- Limpieza de recursos al cerrar el chat
- Manejo de permisos existentes

### **Accesibilidad**
- Navegación por teclado
- Estados de focus visibles
- Mensajes descriptivos para cada acción

## 📱 Compatibilidad

### **Navegadores Soportados**
- Chrome (recomendado)
- Edge
- Safari (limitado)
- Firefox (limitado)

### **Requisitos**
- HTTPS (requerido para permisos de micrófono)
- Permisos de micrófono otorgados
- Web Speech API soportada

## 🔍 Debugging

### **Logs Importantes**
```typescript
// Estado de permisos
console.log('Permisos verificados:', hasPermission);

// Texto reconocido
console.log('Texto reconocido:', text);

// Respuesta del servidor
console.log('Respuesta del backend:', response);

// Errores
console.error('Error procesando voz:', error);
```

### **Estados a Monitorear**
- `isListening`: Si está escuchando
- `isProcessing`: Si está procesando
- `hasPermission`: Si tiene permisos
- `lastRecognizedText`: Último texto reconocido
- `error`: Mensajes de error

## 🎯 Casos de Uso

### **Uso Normal**
1. Usuario presiona micrófono
2. Habla su consulta
3. Sistema procesa y responde en voz
4. Usuario puede hacer nueva consulta

### **Manejo de Errores**
1. Si no hay respuesta del servidor → Mensaje de error en voz
2. Si hay error de conexión → Mensaje de error en voz
3. Si no hay permisos → Solicita permisos

### **Interrupciones**
1. Usuario puede interrumpir la lectura presionando el botón
2. Usuario puede detener el reconocimiento en cualquier momento
3. Sistema se recupera automáticamente de errores

## 🔮 Próximas Mejoras

1. **Comandos de Voz**: "Detener", "Repetir", "Más lento"
2. **Gestos Táctiles**: Doble tap para activar/desactivar
3. **Personalización**: Velocidad de lectura, voz, idioma
4. **Historial**: Guardar conversaciones de voz
5. **Offline**: Funcionalidad básica sin conexión 