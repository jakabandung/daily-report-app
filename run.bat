@echo off
title WorkLog - Daily Report App
cd /d "%~dp0"
echo ========================================================
echo  Menjalankan Aplikasi Daily Report (WorkLog Pro)
echo ========================================================
echo Membuka server lokal di http://localhost:5000 ...
start http://localhost:5000
python app.py
pause
