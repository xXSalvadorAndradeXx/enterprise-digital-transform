# ==========================================
# ERP PMV - Setup del Proyecto
# Autor: Equipo Backend
# ==========================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      ERP PMV - Configuración Inicial"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado." -ForegroundColor Red
    exit 1
}

# Verificar pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm no está instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instálalo ejecutando:"
    Write-Host "npm install -g pnpm"
    exit 1
}

Write-Host "✔ Node: $(node -v)" -ForegroundColor Green
Write-Host "✔ PNPM: $(pnpm -v)" -ForegroundColor Green
Write-Host ""

# Crear .env si no existe
if (!(Test-Path ".env")) {

    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✔ Archivo .env creado desde .env.example" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ No existe .env.example" -ForegroundColor Yellow
    }

}
else {
    Write-Host "✔ Archivo .env existente" -ForegroundColor Green
}

Write-Host ""
Write-Host "Instalando dependencias..."
Write-Host ""

pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error instalando dependencias." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Dependencias instaladas correctamente"
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Si es la primera vez que clonas el proyecto,"
Write-Host "ejecuta una sola vez:"
Write-Host ""
Write-Host "    pnpm approve-builds"
Write-Host ""
Write-Host "y selecciona:"
Write-Host "    ✔ @nestjs/core"
Write-Host "    ✔ bcrypt"
Write-Host ""

Write-Host "Después puedes iniciar el proyecto con:"
Write-Host ""
Write-Host "    pnpm start:dev"
Write-Host ""