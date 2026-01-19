@echo off
REM Script para configurar Node.js portable sin instalación
SET NODE_PATH=%~dp0node-v25.4.0-win-x64
SET PATH=%NODE_PATH%;%PATH%

echo ===============================================
echo Node.js Portable Configurado
echo ===============================================
node --version
echo npm version:
call npm --version
echo ===============================================
echo Ahora puedes usar 'node' y 'npm' en esta ventana
echo ===============================================

REM Mantener la ventana abierta
cmd /k
