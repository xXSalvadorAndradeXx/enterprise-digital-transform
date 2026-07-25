# ==============================
# SETUP PROYECTO NESTJS (POWERSHELL + PNPM)
# ==============================
 
 
Write-Host "Eliminando node_modules y package-lock.json..."
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
}
 
Write-Host "Limpiando cache de pnpm..."
pnpm store prune
 
Write-Host "Instalando dependencias..."
pnpm install
 
Write-Host "Instalando dependencias dotenv..."
pnpm add dotenv
 
Write-Host "Instalando dependencias adicionales..."
pnpm add bcrypt class-validator class-transformer
 
Write-Host "Instalando tipos de desarrollo..."
pnpm add -D @types/node @types/bcrypt
 
Write-Host "Levantando servidor..."
pnpm start:dev
 
Write-Host "Listo 🚀"