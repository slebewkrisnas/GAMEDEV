@echo off
title Deploy ke GitHub - GAMEDEV
color 0b
echo ========================================================
echo   UPLOAD & DEPLOY GAME KE GITHUB REPOSITORY
echo   Target: https://github.com/slebewkrisnas/GAMEDEV
echo ========================================================
echo.
echo Sedang menyiapkan pengunggahan file game ke branch main...
echo.

git remote set-url origin https://github.com/slebewkrisnas/GAMEDEV.git

echo Menjalankan git push ke GitHub...
echo (Jika jendela browser login GitHub muncul, silakan klik 'Sign in with your browser' / 'Authorize')
echo.

git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   [BERHASIL!] KODE GAME BERHASIL DI-PUSH KE GITHUB!
    echo ========================================================
    echo.
    echo Langkah terakhir agar game bisa dimainkan secara online:
    echo 1. Buka link ini di browser:
    echo    https://github.com/slebewkrisnas/GAMEDEV/settings/pages
    echo 2. Di bagian "Build and deployment" ^> "Branch":
    echo    - Pilih "main" dan folder "/ (root)"
    echo    - Klik tombol "Save"
    echo 3. Tunggu 1 menit, game Anda akan live di:
    echo    https://slebewkrisnas.github.io/GAMEDEV/
    echo.
    echo ========================================================
) else (
    echo.
    echo [PERINGATAN] Terjadi kendala saat push. Pastikan koneksi internet lancar dan Anda telah mengizinkan login GitHub.
)

echo.
pause
