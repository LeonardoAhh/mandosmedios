# Script de instalación con Node.js local
$nodePath = "C:\Users\Capacitacion - QRO\.gemini\antigravity\scratch\evaluacion-liderazgo\nodejs"
$env:Path = "$nodePath;$env:Path"

Write-Host "Node version:" -ForegroundColor Green
node --version

Write-Host "`nNPM version:" -ForegroundColor Green
npm --version

Write-Host "`nInstalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host "`nInstalación completada!" -ForegroundColor Green
