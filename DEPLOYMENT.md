# Despliegue en Render.com

## Requisitos Previos

1. **Cuenta en Render.com**: Regístrate en [render.com](https://render.com)
2. **Repositorio Git**: Tu código debe estar en un repositorio Git (GitHub, GitLab, etc.)
3. **Node.js**: Render.com soporta Node.js automáticamente

## Configuración del Proyecto

### Archivos de Configuración

El proyecto ya incluye los siguientes archivos necesarios para el despliegue:

- `render.yaml`: Configuración del servicio web
- `.dockerignore`: Archivos excluidos del build
- `package.json`: Scripts de build y start

### Scripts de Build

Los scripts configurados en `package.json` son:

```json
{
  "build": "ng build",
  "serve:ssr:e-commerce-app": "node dist/e-commerce-app/server/server.mjs"
}
```

## Pasos para Desplegar

### 1. Conectar el Repositorio

1. Ve a tu dashboard de Render.com
2. Haz clic en "New +" y selecciona "Web Service"
3. Conecta tu repositorio Git
4. Render detectará automáticamente que es una aplicación Node.js

### 2. Configuración del Servicio

- **Name**: `ecommerce-copilot` (o el nombre que prefieras)
- **Environment**: `Node`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run serve:ssr:e-commerce-app`
- **Plan**: Free (para empezar)

### 3. Variables de Entorno

Configura las siguientes variables de entorno si las necesitas:

- `NODE_ENV`: `production`
- `PORT`: Render.com lo configura automáticamente

### 4. Despliegue Automático

- **Auto-Deploy**: Activado (se despliega automáticamente con cada push)
- **Branch**: `main` (o tu rama principal)

## Características del Despliegue

### Server-Side Rendering (SSR)

La aplicación está configurada con Angular SSR, lo que proporciona:

- Mejor SEO
- Renderizado más rápido
- Mejor experiencia de usuario

### Optimizaciones

- **Static Files**: Servidos con cache de 1 año
- **Compression**: Automática en Render.com
- **CDN**: Distribución global automática

## Monitoreo y Logs

- **Health Check**: Configurado en `/`
- **Logs**: Disponibles en el dashboard de Render.com
- **Metrics**: Monitoreo automático de rendimiento

## Troubleshooting

### Problemas Comunes

1. **Build Fails**: Verifica que todas las dependencias estén en `package.json`
2. **Start Command Error**: Asegúrate de que el script `serve:ssr:e-commerce-app` existe
3. **Port Issues**: Render.com configura automáticamente la variable `PORT`

### Logs Útiles

```bash
# Ver logs en tiempo real
render logs --tail

# Ver logs específicos del servicio
render logs --service ecommerce-copilot
```

## Costos

- **Free Tier**: Incluye 750 horas/mes
- **Paid Plans**: Desde $7/mes para uso ilimitado

## URLs

Una vez desplegado, tu aplicación estará disponible en:
`https://ecommerce-copilot.onrender.com` (o el nombre que hayas elegido) 