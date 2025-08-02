# Script para descargar imágenes de productos
Write-Host "Descargando imágenes de productos..." -ForegroundColor Green

# Crear la carpeta si no existe
if (!(Test-Path "public\images\products")) {
    New-Item -ItemType Directory -Path "public\images\products" -Force
}

# Lista de imágenes con URLs de Unsplash
$images = @(
    @{name="camiseta-basica.jpg"; url="https://images.unsplash.com/photo-1544966503-7cc8789a1e3b?w=300&h=400&fit=crop"},
    @{name="smartphone-galaxy.jpg"; url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=400&fit=crop"},
    @{name="refrigerador-samsung.jpg"; url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop"},
    @{name="pizza-margherita.jpg"; url="https://images.unsplash.com/photo-1565299624946-1f28f904870d?w=300&h=400&fit=crop"},
    @{name="laptop-dell.jpg"; url="https://images.unsplash.com/photo-1496181137766-63cb3b2d7e49?w=300&h=400&fit=crop"},
    @{name="jeans-slim-fit.jpg"; url="https://images.unsplash.com/photo-1542272604-787c381bbbd8?w=300&h=400&fit=crop"},
    @{name="cafe-colombiano.jpg"; url="https://images.unsplash.com/photo-1495474472287-4d71b3d1b5b9?w=300&h=400&fit=crop"},
    @{name="auriculares-sony.jpg"; url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=400&fit=crop"},
    @{name="vestido-elegante.jpg"; url="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop"},
    @{name="chocolate-artesanal.jpg"; url="https://images.unsplash.com/photo-1548907040-4baa4195d3b9?w=300&h=400&fit=crop"},
    @{name="tablet-ipad.jpg"; url="https://images.unsplash.com/photo-1544244015-0bf4b3ff9b2c?w=300&h=400&fit=crop"},
    @{name="zapatillas-nike.jpg"; url="https://images.unsplash.com/photo-1542291026-7eec264cceff?w=300&h=400&fit=crop"},
    @{name="sofa-moderno.jpg"; url="https://images.unsplash.com/photo-1555041463-194f5a2d9b36?w=300&h=400&fit=crop"},
    @{name="libro-senor-anillos.jpg"; url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"}
)

foreach ($image in $images) {
    $outputPath = "public\images\products\$($image.name)"
    Write-Host "Descargando $($image.name)..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $image.url -OutFile $outputPath -TimeoutSec 30
        Write-Host "✓ $($image.name) descargada" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error: $($image.name)" -ForegroundColor Red
    }
}

Write-Host "Descarga completada!" -ForegroundColor Green 