# ==============================
# SETUP PROYECTO NESTJS (POWERSHELL)
# ==============================

Write-Host "Instalando dependencias..."
npm install

Write-Host "Instalando dependencias adicionales..."
npm install bcrypt class-validator class-transformer

Write-Host "Instalando tipos de desarrollo..."
npm install -D @types/node @types/bcrypt

Write-Host "Eliminando node_modules y package-lock.json..."
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
}

Write-Host "Reinstalando todo limpio..."
npm install

Write-Host "Levantando servidor..."
npm run start:dev

Write-Host "Listo 🚀"