# Despliegue en Vercel

## ¿Por qué Vercel?

Vercel es una plataforma excelente para aplicaciones Angular con SSR porque:

- **Despliegue automático** desde Git
- **Edge Network** global para mejor rendimiento
- **Serverless Functions** para SSR
- **Preview Deployments** para cada PR
- **Analytics** integrados
- **Hobby Plan** gratuito generoso

## Requisitos Previos

1. **Cuenta en Vercel**: Regístrate en [vercel.com](https://vercel.com)
2. **Repositorio Git**: Tu código debe estar en GitHub, GitLab o Bitbucket
3. **Vercel CLI** (opcional): `npm i -g vercel`

## Configuración del Proyecto

### Archivos de Configuración

El proyecto incluye los siguientes archivos para Vercel:

- `vercel.json`: Configuración principal de Vercel
- `.vercelignore`: Archivos excluidos del despliegue
- `package.json`: Scripts optimizados para Vercel

### Configuración de Build

```json
{
  "build:vercel": "ng build --configuration production",
  "vercel-build": "npm run build:vercel"
}
```

## Pasos para Desplegar

### Opción 1: Despliegue desde Dashboard (Recomendado)

1. **Ve a [vercel.com](https://vercel.com)** y crea una cuenta
2. **Haz clic en "New Project"**
3. **Importa tu repositorio** desde GitHub/GitLab/Bitbucket
4. **Vercel detectará automáticamente** que es una aplicación Angular
5. **Configuración automática**:
   - Framework Preset: Angular
   - Build Command: `npm run build:vercel`
   - Output Directory: `dist/e-commerce-app/browser`
   - Install Command: `npm ci`

### Opción 2: Despliegue con CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

## Configuración Avanzada

### Variables de Entorno

En el dashboard de Vercel, configura:

- `NODE_ENV`: `production`
- `VERCEL`: `1` (automático)

### Dominios Personalizados

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Configura los DNS según las instrucciones

## Características del Despliegue

### Server-Side Rendering (SSR)

- **Serverless Functions**: Tu app se ejecuta en Edge Functions
- **Cold Start**: Optimizado para aplicaciones Angular
- **Caching**: Automático en Edge Network

### Optimizaciones Automáticas

- **Image Optimization**: Automática
- **Code Splitting**: Angular lo maneja automáticamente
- **Compression**: Gzip/Brotli automático
- **CDN**: Edge Network global

### Preview Deployments

- Cada PR genera un preview automático
- URLs únicas para cada deployment
- Testing antes de merge a main

## Monitoreo y Analytics

### Vercel Analytics

- **Web Vitals**: Core Web Vitals automáticos
- **Performance**: Métricas de rendimiento
- **Real User Monitoring**: Datos reales de usuarios

### Logs

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver logs específicos
vercel logs --function=dist/e-commerce-app/server/server.mjs
```

## Troubleshooting

### Problemas Comunes

1. **Build Fails**:
   ```bash
   # Verificar build localmente
   npm run build:vercel
   ```

2. **SSR Issues**:
   - Verifica que `server.mjs` existe en `dist/`
   - Revisa logs en Vercel Dashboard

3. **Environment Variables**:
   - Asegúrate de que estén configuradas en Vercel
   - No uses `.env` files en producción

### Debugging

```bash
# Build local para testing
npm run build:vercel

# Test SSR localmente
npm run serve:ssr:e-commerce-app
```

## Comparación: Vercel vs Render

| Característica | Vercel | Render |
|----------------|--------|--------|
| **Hobby Plan** | Gratis | 750h/mes |
| **SSR** | ✅ Excelente | ✅ Bueno |
| **Edge Network** | ✅ Global | ❌ Limitado |
| **Preview Deployments** | ✅ Automático | ❌ Manual |
| **Analytics** | ✅ Integrado | ❌ No |
| **CLI** | ✅ Muy bueno | ✅ Básico |

## URLs y Dominios

### URLs Automáticas

- **Production**: `https://tu-proyecto.vercel.app`
- **Preview**: `https://tu-proyecto-git-rama.vercel.app`
- **Custom Domain**: `https://tudominio.com`

### Configuración de Dominio

1. **Settings → Domains** en Vercel
2. **Agregar dominio personalizado**
3. **Configurar DNS** según instrucciones
4. **SSL automático** incluido

## Costos

### Hobby Plan (Gratis)
- **100GB Bandwidth/mes**
- **100GB Storage**
- **6000 Function Invocations/mes**
- **Unlimited Personal Projects**

### Pro Plan ($20/mes)
- **1TB Bandwidth/mes**
- **100GB Storage**
- **100,000 Function Invocations/mes**
- **Team Collaboration**

## Próximos Pasos

1. **Sube tu código** a Git
2. **Conecta con Vercel** desde el dashboard
3. **Configura variables de entorno** si las necesitas
4. **¡Despliega!** 🚀

Tu aplicación estará disponible en minutos con todas las optimizaciones de Vercel. 