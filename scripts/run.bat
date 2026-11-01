@echo off
setlocal
title FateCovenant local server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-server.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" echo [ERROR] Server launcher failed with exit code %EXIT_CODE%.
exit /b %EXIT_CODE%
