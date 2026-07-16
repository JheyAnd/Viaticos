# Biaticos - Iniciar proyecto
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host "    BIATICOS - Sistema de Legalizacion" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  [1/2] Iniciando Backend (FastAPI - Puerto 8029)..." -ForegroundColor Yellow
Start-Process "cmd" -ArgumentList '/k "cd /d C:\Users\Yeison\Documents\Biaticos\backend && python main.py"' -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "  [2/2] Iniciando Frontend (Vite - Puerto 5173)..." -ForegroundColor Yellow
Start-Process "cmd" -ArgumentList '/k "cd /d C:\Users\Yeison\Documents\Biaticos\frontend && npm run dev"' -WindowStyle Normal

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "   Proyecto iniciado correctamente!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:8029" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8029/docs" -ForegroundColor White
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "  Abriendo navegador..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
