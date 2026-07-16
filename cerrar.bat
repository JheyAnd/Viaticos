@echo off
title Biaticos - Cerrando Proyecto
color 0C
echo.
echo  Cerrando Sistema de Biaticos...
echo  ================================
echo.
echo  [1/4] Cerrando ventana del Backend...
taskkill /FI "WINDOWTITLE eq Biaticos - Backend*" /T /F >nul 2>&1
echo  [2/4] Cerrando ventana del Frontend...
taskkill /FI "WINDOWTITLE eq Biaticos - Frontend*" /T /F >nul 2>&1
echo  [3/4] Liberando puerto 8016 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8016 " ^| findstr "LISTENING"') do (taskkill /PID %%a /T /F >nul 2>&1)
echo  [4/4] Liberando puerto 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (taskkill /PID %%a /T /F >nul 2>&1)
echo.
echo  ==========================================
echo   Todos los procesos cerrados!
echo   Puerto 8016: Liberado
echo   Puerto 5173: Liberado
echo  ==========================================
echo.
pause >nul