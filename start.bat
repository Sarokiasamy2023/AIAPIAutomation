@echo off
echo ========================================
echo GS API Test Platform - Network Ready
echo ========================================
echo.

echo [1/5] Killing existing processes
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Check if node_modules exists
if not exist "frontend\node_modules" (
    echo ERROR: Node modules not found
    echo Run: cd frontend ^&^& npm install
    pause
    exit /b 1
)

REM Check if .env exists
if not exist "backend\.env" (
    echo Creating .env file...
    copy "backend\.env.example" "backend\.env"
    echo.
    echo IMPORTANT: Edit backend\.env with your Azure OpenAI credentials
    echo.
)

echo [2/5] Configuring Windows Firewall for Network Access
echo Checking firewall rules

REM Check if firewall rules exist, create if not
netsh advfirewall firewall show rule name="AI API Backend" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating firewall rule for Backend (port 8000)
    netsh advfirewall firewall add rule name="AI API Backend" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   ✓ Backend firewall rule created
    ) else (
        echo   ⚠ Could not create firewall rule (requires admin rights)
        echo   Run as Administrator or manually allow port 8000
    )
) else (
    echo   ✓ Backend firewall rule exists
)

netsh advfirewall firewall show rule name="AI API Frontend" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating firewall rule for Frontend (port 5000)
    netsh advfirewall firewall add rule name="AI API Frontend" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   ✓ Frontend firewall rule created
    ) else (
        echo   ⚠ Could not create firewall rule (requires admin rights)
        echo   Run as Administrator or manually allow port 5000
    )
) else (
    echo   ✓ Frontend firewall rule exists
)

echo.
echo [3/5] Detecting Network Configuration
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP_ADDRESS=%%a
    goto :found_ip
)
:found_ip
set IP_ADDRESS=%IP_ADDRESS: =%

REM Get hostname
for /f %%a in ('hostname') do set HOSTNAME=%%a

echo   Local IP: %IP_ADDRESS%
echo   Hostname: %HOSTNAME%
echo.

echo [4/5] Starting Backend Server on port 8000
start "GS API Backend - DO NOT CLOSE" powershell -NoExit -Command "cd backend; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 4 /nobreak >nul

echo [5/5] Starting Frontend Server on port 5000
start "GS API Frontend - DO NOT CLOSE" powershell -NoExit -Command "cd frontend; npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Servers Started - Network Ready!
echo ========================================
echo.
echo LOCAL ACCESS:
echo   Frontend: http://localhost:5000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo NETWORK ACCESS (from other machines):
echo   Frontend: http://%IP_ADDRESS%:5000
echo   Backend:  http://%IP_ADDRESS%:8000
echo   API Docs: http://%IP_ADDRESS%:8000/docs
echo.
echo VM HOSTNAME ACCESS:
echo   Frontend: http://ehb-omsbxas-t01.ehbsbx.work:5000
echo   Backend:  http://ehb-omsbxas-t01.ehbsbx.work:8000
echo   API Docs: http://ehb-omsbxas-t01.ehbsbx.work:8000/docs
echo.
echo ========================================
echo Network Configuration:
echo   ✓ CORS: Enabled for all origins
echo   ✓ Host Binding: 0.0.0.0 (all interfaces)
echo   ✓ Firewall: Configured for ports 5000 and 8000
echo   ✓ Auto-detection: Frontend connects to backend automatically
echo ========================================
echo.
echo Close the server windows to stop the application.
pause
