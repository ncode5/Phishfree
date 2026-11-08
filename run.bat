@echo off
setlocal
cd /d "%~dp0"
title PhishFree - Digital Trust Intelligence Runner
echo ==========================================================
echo Starting AI-Powered Web Threat Detection ^& Trust Intelligence
echo ==========================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "PhishFree Backend" cmd /k "cd /d "%~dp0backend" && set PYTHONPATH=%~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

ping -n 3 127.0.0.1 >nul

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173...
start "PhishFree Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

ping -n 3 127.0.0.1 >nul

echo ==========================================================
echo Application is running!
echo - Frontend UI:   http://127.0.0.1:5173
echo - Backend API:   http://127.0.0.1:8000/docs
echo ==========================================================
start http://127.0.0.1:5173
