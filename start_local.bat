@echo off
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe py -3 -m venv .venv
if errorlevel 1 goto fail
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto fail
if not exist .env copy .env.example .env
if not exist data\knowledge.sqlite .venv\Scripts\python.exe tools\bootstrap.py
if errorlevel 1 goto fail
echo Open http://127.0.0.1:8000 in your browser.
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
:fail
pause
