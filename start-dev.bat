@echo off
title Swappanini Dev Server
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
echo Starting Swappanini dev server...
npm run dev
pause
