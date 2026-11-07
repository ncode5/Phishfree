# PhishFree — Digital Trust Intelligence Runner (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting AI-Powered Web Threat Detection & Trust Intelligence" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting React Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; & 'npm.cmd' run dev -- --host 127.0.0.1 --port 5173"

Start-Sleep -Seconds 2

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "Application successfully started!" -ForegroundColor Green
Write-Host "  Frontend UI:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  Backend API:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green

Start-Process "http://127.0.0.1:5173"

