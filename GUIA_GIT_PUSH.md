# Guía para Subir Cambios a GitHub

## ⚠️ Situación Actual
Git no está instalado en esta computadora y el proyecto no tiene un repositorio `.git` configurado.

## 📋 Archivos Modificados/Creados

### Nuevos Archivos:
- `src/pages/rh/EmployeeProgress.jsx` - Página de progreso de encuestas
- `src/pages/rh/EmployeeProgress.css` - Estilos para la página
- `scripts/load-employees-admin.js` - Script para cargar empleados
- `scripts/delete-auth-users.js` - Script para limpiar usuarios
- `scripts/cleanup-users.js` - Script de limpieza
- `scripts/sync-firestore-only.js` - Script de sincronización
- `setup-node.bat` - Script para configurar Node.js portable

### Archivos Modificados:
- `src/App.jsx` - Agregada ruta `/rh/progreso`
- `firestore.rules` - Reglas de seguridad actualizadas
- `.gitignore` - Agregados archivos sensibles
- `package.json` - Dependencias actualizadas
- `empleados.json` - Datos de empleados corregidos

### Archivos a NO subir (ya en .gitignore):
- `firebase-admin-key.json` - ⚠️ Credenciales sensibles
- `credenciales-empleados-*.csv` - ⚠️ Passwords de empleados
- `.env.local` - ⚠️ Configuración de Firebase
- `node-v25.4.0-win-x64/` - Node.js portable
- `node_modules/` - Dependencias

## 🚀 Opciones para Subir Cambios

### Opción 1: GitHub Desktop (Sin instalación admin)
1. Descarga GitHub Desktop portable
2. Abre la carpeta del proyecto
3. Haz commit de los cambios
4. Push al repositorio

### Opción 2: Git Portable
1. Descarga Git Portable: https://git-scm.com/download/win
2. Extrae en una carpeta
3. Usa Git Bash para hacer commit y push

### Opción 3: Desde otra computadora con Git
Comandos a ejecutar:

```bash
# Ir a la carpeta del proyecto
cd mandosmedios-main

# Ver cambios
git status

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "feat: Agregada página de progreso de encuestas y scripts de carga masiva

- Nueva página /rh/progreso para monitorear completado de encuestas
- Scripts para carga masiva de empleados con Admin SDK
- Actualización de reglas de Firestore
- Correcciones en empleados.json"

# Subir a GitHub
git push origin main
```

### Opción 4: Upload manual en GitHub.com
1. Ve a tu repositorio en GitHub
2. Click en "Add file" → "Upload files"
3. Arrastra los archivos modificados
4. Agrega mensaje de commit
5. Click "Commit changes"

## ⚡ Comando Rápido (Si tienes Git)
```bash
git add src/pages/rh/* src/App.jsx firestore.rules .gitignore scripts/*.js
git commit -m "feat: Employee progress page and bulk loading scripts"
git push
```
