@echo off
echo 🔻 Stopping all running servers...

:: Kill all Python servers
taskkill /F /IM python.exe /T

:: Kill all Node.js servers
taskkill /F /IM node.exe /T

echo ✅ All Python and Node.js servers stopped.
pause
