@echo off
cd /d "%~dp0"
title PhishFree — Digital Trust Intelligence Runner
echo ==========================================================
echo Starting AI-Powered Web Threat Detection & Trust Intelligence
echo ==========================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "PhishFree Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173...
start "PhishFree Frontend (Vite)" cmd /k "cd frontend && npm.cmd run dev -- --host 127.0.0.1 --port 5173"

timeout /t 2 /nobreak >nul

echo ==========================================================
echo Application launched!
echo - Frontend UI:   http://127.0.0.1:5173
echo - Backend API:   http://127.0.0.1:8000/docs
echo ==========================================================
start http://127.0.0.1:5173

