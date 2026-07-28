@echo off
cd /d "%~dp0"
start "TELEC Event Manager Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start http://localhost:4310
