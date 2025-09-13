@echo off
echo 🚀 Starting Campus Document Verification API...
echo.
cd /d "%~dp0src"
echo Current directory: %cd%
echo.
python main.py
echo.
echo Press any key to exit...
pause > nul
