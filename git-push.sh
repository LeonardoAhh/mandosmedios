# Script para inicializar Git y subir cambios
# Ejecutar este script cuando tengas acceso a Git

# Paso 1: Inicializar repositorio Git
git init

# Paso 2: Configurar el repositorio remoto
git remote add origin https://github.com/LeonardoAhh/mandosmedios.git

# Paso 3: Traer la información del repositorio remoto
git fetch origin

# Paso 4: Configurar la rama principal
git branch -M main

# Paso 5: Vincular la rama local con la remota
git branch --set-upstream-to=origin/main main

# Paso 6: Hacer pull para sincronizar (si hay cambios en remoto)
git pull origin main --allow-unrelated-histories

# Paso 7: Agregar todos los archivos nuevos y modificados
git add .

# Paso 8: Hacer commit con mensaje descriptivo
git commit -m "feat: Employee progress tracking and bulk loading system

- Added employee progress monitoring page at /rh/progreso
- Created bulk employee loading scripts with Firebase Admin SDK
- Updated Firestore security rules
- Fixed employee data in empleados.json
- Added EmployeeProgress component with filters and statistics
- Created scripts for user management (load, cleanup, delete)
- Updated .gitignore for sensitive files"

# Paso 9: Subir los cambios a GitHub
git push -u origin main

echo "✅ Cambios subidos exitosamente a GitHub!"
