@echo off
setlocal
set "PROJECT_DIR=%~dp0"

if not exist "%PROJECT_DIR%backend\venv\Scripts\python.exe" (
    echo Backend Python ortami bulunamadi.
    echo README.md dosyasindaki Backend Kurulumu adimlarini uygulayin.
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%frontend\node_modules\vite\bin\vite.js" (
    echo Frontend bagimliliklari bulunamadi.
    echo Bir terminal acip su komutlari calistirin:
    echo cd /d "%PROJECT_DIR%frontend"
    echo npm install
    pause
    exit /b 1
)

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo Backend baslatiliyor...
    start "CepKontrol Backend" /D "%PROJECT_DIR%backend" "%PROJECT_DIR%backend\venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) else (
    echo 8000 portu zaten kullanimda; backend tekrar baslatilmadi.
)

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo Frontend baslatiliyor...
    start "CepKontrol Frontend" /D "%PROJECT_DIR%frontend" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"
) else (
    echo 5173 portu zaten kullanimda; frontend tekrar baslatilmadi.
)

echo Sunucularin baslamasi bekleniyor...
timeout /t 5 /nobreak >nul
start "" "http://127.0.0.1:5173"
echo CepKontrol AI: http://127.0.0.1:5173
echo Backend saglik kontrolu: http://127.0.0.1:8000/api/health
endlocal
