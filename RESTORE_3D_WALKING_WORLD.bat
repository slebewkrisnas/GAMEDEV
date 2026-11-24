@echo off
title RESTORE 3D WALKING WORLD BACKUP
color 0A
echo ============================================================
echo   RESTORE BACKUP DUNIA 3D WALKING GAME (DESA ASRI 60 FPS)
echo ============================================================
echo.
echo Sedang memulihkan file dunia 3D dari folder backup_3d_walking_world...

if not exist "backup_3d_walking_world" (
    color 0C
    echo [ERROR] Folder backup_3d_walking_world tidak ditemukan!
    echo.
    pause
    exit /b 1
)

xcopy /E /I /Y "backup_3d_walking_world\*" "gamedevs\" >nul

echo.
echo ============================================================
echo   BERHASIL! Seluruh file dunia 3D telah dipulihkan seperti semula!
echo ============================================================
echo.
pause
