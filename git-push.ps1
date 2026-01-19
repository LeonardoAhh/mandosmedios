# Script PowerShell para inicializar Git y subir cambios
# Ejecutar este script cuando tengas acceso a Git

Write-Host "🚀 Iniciando proceso de Git..." -ForegroundColor Cyan

# Paso 1: Inicializar repositorio Git
Write-Host "`n📦 Inicializando repositorio..." -ForegroundColor Yellow
git init

# Paso 2: Configurar el repositorio remoto
Write-Host "`n🔗 Configurando repositorio remoto..." -ForegroundColor Yellow
git remote add origin https://github.com/LeonardoAhh/mandosmedios.git

# Paso 3: Traer la información del repositorio remoto
Write-Host "`n📥 Obteniendo información del repositorio remoto..." -ForegroundColor Yellow
git fetch origin

# Paso 4: Configurar la rama principal
Write-Host "`n🌿 Configurando rama principal..." -ForegroundColor Yellow
git branch -M main

# Paso 5: Vincular la rama local con la remota
Write-Host "`n🔗 Vinculando rama local con remota..." -ForegroundColor Yellow
git branch --set-upstream-to=origin/main main

# Paso 6: Hacer pull para sincronizar (si hay cambios en remoto)
Write-Host "`n⬇️  Sincronizando con repositorio remoto..." -ForegroundColor Yellow
git pull origin main --allow-unrelated-histories

# Paso 7: Agregar todos los archivos nuevos y modificados
Write-Host "`n➕ Agregando archivos..." -ForegroundColor Yellow
git add .

# Paso 8: Hacer commit con mensaje descriptivo
Write-Host "`n💾 Creando commit..." -ForegroundColor Yellow
git commit -m "feat: Employee progress tracking and bulk loading system

- Added employee progress monitoring page at /rh/progreso
- Created bulk employee loading scripts with Firebase Admin SDK
- Updated Firestore security rules
- Fixed employee data in empleados.json
- Added EmployeeProgress component with filters and statistics
- Created scripts for user management (load, cleanup, delete)
- Updated .gitignore for sensitive files"

# Paso 9: Subir los cambios a GitHub
Write-Host "`n⬆️  Subiendo cambios a GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n✅ ¡Cambios subidos exitosamente a GitHub!" -ForegroundColor Green
Write-Host "🌐 Repositorio: https://github.com/LeonardoAhh/mandosmedios" -ForegroundColor Cyan
