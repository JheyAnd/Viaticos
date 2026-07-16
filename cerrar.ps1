# Biaticos - Cerrar proyecto
Write-Host ""
Write-Host "  Cerrando Sistema de Biaticos..." -ForegroundColor Red
Write-Host "  ================================" -ForegroundColor Red
Write-Host ""

Write-Host "  [1/4] Cerrando ventana del Backend..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.MainWindowTitle -like "*Biaticos - Backend*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "  [2/4] Cerrando ventana del Frontend..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.MainWindowTitle -like "*Biaticos - Frontend*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "  [3/4] Liberando puerto 8029 (Backend)..." -ForegroundColor Yellow
$pid8029 = (Get-NetTCPConnection -LocalPort 8029 -ErrorAction SilentlyContinue).OwningProcess
if ($pid8029) { Stop-Process -Id $pid8029 -Force -ErrorAction SilentlyContinue }

Write-Host "  [4/4] Liberando puerto 5173 (Frontend)..." -ForegroundColor Yellow
$pid5173 = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess
if ($pid5173) { Stop-Process -Id $pid5173 -Force -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "   Todos los procesos cerrados!" -ForegroundColor Green
Write-Host "   Puerto 8029: Liberado" -ForegroundColor White
Write-Host "   Puerto 5173: Liberado" -ForegroundColor White
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""
