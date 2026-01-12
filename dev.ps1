# Script para ejecutar el servidor de desarrollo
$nodePath = "C:\Users\Capacitacion - QRO\.gemini\antigravity\scratch\evaluacion-liderazgo\nodejs"
$env:Path = "$nodePath;$env:Path"

Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Green
npm run dev
