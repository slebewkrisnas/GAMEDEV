@echo off
title Menjalankan 3D Walking Game
echo ========================================================
echo   MENJALANKAN 3D WALKING GAME (REALISTIC MAN 3D)
echo ========================================================
echo.
echo Memeriksa sistem...

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js terdeteksi. Menjalankan web server lokal...
    start "" http://localhost:5500/gamedevs/main.html
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.fbx':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.mp3':'audio/mpeg','.mp4':'video/mp4','.webm':'video/webm'};http.createServer((req,res)=>{let p=decodeURI(req.url.split('?')[0]);if(p==='/')p='/gamedevs/main.html';const f=path.join(process.cwd(),p);if(!fs.existsSync(f)){res.writeHead(404);return res.end('Not found');}const s=fs.statSync(f);if(s.isDirectory()){const idx=path.join(f,'index.html');if(fs.existsSync(idx)){res.writeHead(200,{'Content-Type':'text/html'});return fs.createReadStream(idx).pipe(res);}}const ext=path.extname(f).toLowerCase();res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Access-Control-Allow-Origin':'*','Accept-Ranges':'bytes'});fs.createReadStream(f).pipe(res);}).listen(5500,()=>{console.log('Game berjalan di: http://localhost:5500/gamedevs/main.html');console.log('Jangan tutup jendela ini saat bermain!');});"
    exit /b
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python terdeteksi. Menjalankan web server lokal...
    start "" http://localhost:8000/gamedevs/main.html
    python -m http.server 8000
    exit /b
)

echo [PEMBERITAHUAN] Membuka game...
start "" http://localhost:5500/gamedevs/main.html
pause

