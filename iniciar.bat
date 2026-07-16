@echo off
title Biaticos - Iniciando Proyecto
color 0A
echo.
echo  ======================================
echo    BIATICOS - Sistema de Legalizacion
echo  ======================================
echo.
echo  [1/2] Iniciando Backend (FastAPI - Puerto 8029)...
start "Biaticos - Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 3 /nobreak >nul
echo  [2/2] Iniciando Frontend (Vite - Puerto 5173)...
start "Biaticos - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul
echo.
echo  ==========================================
echo   Proyecto iniciado correctamente!
echo   Backend:  http://localhost:8029
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8029/docs
echo  ==========================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
pause >nul