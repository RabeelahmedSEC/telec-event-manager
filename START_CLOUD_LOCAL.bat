@echo off
set PORT=4310
set TELEC_DATA_DIR=%~dp0data
set TELEC_BACKUP_DIR=%~dp0backups
node server.js
pause
