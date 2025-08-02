$images = @(
    "camiseta-basica.jpg",
    "smartphone-galaxy.jpg", 
    "refrigerador-samsung.jpg",
    "pizza-margherita.jpg",
    "laptop-dell.jpg",
    "jeans-slim-fit.jpg",
    "cafe-colombiano.jpg",
    "auriculares-sony.jpg",
    "vestido-elegante.jpg",
    "chocolate-artesanal.jpg",
    "tablet-ipad.jpg",
    "zapatillas-nike.jpg",
    "sofa-moderno.jpg",
    "libro-senor-anillos.jpg"
)

Write-Host "Descargando imagenes..." -ForegroundColor Green

for ($i = 0; $i -lt $images.Length; $i++) {
    $imageName = $images[$i]
    $randomNum = $i + 1
    $url = "https://picsum.photos/300/400?random=$randomNum"
    $outputPath = "public/images/products/$imageName"
    
    Write-Host "Descargando $imageName..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $outputPath
    Write-Host "✓ $imageName descargada" -ForegroundColor Green
}

Write-Host "Todas las imagenes descargadas!" -ForegroundColor Green 