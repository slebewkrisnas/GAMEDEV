---
name: web-game-dev
description: Use when creating, debugging, or optimizing 2D and 3D web games, Web Audio sound synthesis, NPC/Zombie AI, or Three.js mechanics in the websss repository.
---

# Web Game Development & Codebase Architecture (websss)

Dokumen skill ini berisi panduan teknis serta **penjelasan lengkap struktur proyek per file** untuk seluruh modul game di repositori `websss`.

---

## 1. Struktur Proyek File-per-File

```
websss/
├── GEMINI.md                               # Instruksi dan panduan AI untuk repositori ini
├── AGENTS.md                               # Alias instruksi AI universal
├── GAMEPLAY_AUDIT_REPORT.md                # Laporan audit gameplay, evaluasi mekanika, dan catatan bug
├── index.html                              # Halaman portal/landing page websss
├── .agents/
│   ├── README.md                           # Dokumentasi sistem skill workspace
│   └── skills/                             # Koleksi skill lokal (superpowers, ponytail, graphify, web-game-dev)
└── gamedevs/                               # Direktori utama modul game
    ├── index.html & main.html              # Entry point HTML untuk game 2D & hub
    ├── style.css                           # Styling antarmuka, HUD, Canvas container
    ├── logo.png                            # Asset grafis/branding
    ├── app.js                              # Engine utama game 2D (Player, Loop, Canvas render)
    ├── audio_system.js                     # Sistem Web Audio API (Synthesizer suara 2D)
    ├── npc_system.js                       # Logika AI & perilaku NPC untuk game 2D
    ├── bakalae/                            # Eksperimen/prototipe mini-game
    │   └── index.html                      # Entry point mini-game Bakalae
    └── dead-zone/                          # Game 3D Zombie Survival Shooter (Three.js)
        ├── index.html                      # Entry point WebGL 3D Dead Zone
        ├── dead-zone.zip                   # Backup arsip build Dead Zone
        ├── css/
        │   └── style.css                   # Styling HUD 3D, crosshair, darah, ammo, wave counter
        └── js/
            ├── main.js                     # Orkestrator Three.js: scene, camera, render loop, game states
            ├── player.js                   # Kontroler pemain 3D (pergerakan FPS/TPS, mouse look, physics)
            ├── weapons.js                  # Mekanika senjata (raycasting tembakan, recoil, reload, amunisi)
            ├── zombies.js                  # Spawner & AI Zombie (pathfinding mengejar pemain, radius serang)
            ├── waves.js                    # Wave Manager (skalasi kesulitan, timer spawn, wave interval)
            ├── environment.js              # Peta 3D (lighting, kabut malam, rintangan, bangunan, lantai)
            ├── audio.js                    # Web Audio 3D (suara tembakan, erangan zombie, langkah kaki)
            ├── touchControls.js            # Kontrol sentuh layar/virtual joystick untuk perangkat mobile
            ├── ui.js                       # Manajemen HUD, score bar, game over screen, dan restart
            └── libs/
                └── three.module.js         # Modul library Three.js (WebGL 3D engine)
```

---

## 2. Rincian Fungsi Per File

### A. Root Proyek
1. **[`GAMEPLAY_AUDIT_REPORT.md`](file:///c:/Users/krisn/Desktop/websss/GAMEPLAY_AUDIT_REPORT.md)**:
   * Laporan mendalam audit mekanika game: menganalisis responsivitas kontrol, audio latency, bug zombie clipping, dan optimasi frame rate.
2. **[`GEMINI.md`](file:///c:/Users/krisn/Desktop/websss/GEMINI.md) & [`AGENTS.md`](file:///c:/Users/krisn/Desktop/websss/AGENTS.md)**:
   * Kontrak standar kerja agen AI agar selalu konsisten dengan arsitektur native (Vanilla JS, 60 FPS, Web Audio).
3. **[`index.html`](file:///c:/Users/krisn/Desktop/websss/index.html)**:
   * Portal beranda untuk memilih game yang ingin dimainkan di browser.

---

### B. Modul Game 2D Canvas (`gamedevs/`)
1. **[`gamedevs/app.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/app.js)**:
   * **Fungsi Utama:** Inti dari engine 2D. Mengatur inisialisasi Canvas 2D, perulangan frame (`requestAnimationFrame`), input keyboard/mouse, fisika pergerakan pemain, dan rendering frame buffer.
2. **[`gamedevs/audio_system.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/audio_system.js)**:
   * **Fungsi Utama:** Generator efek suara prosedural menggunakan Web Audio API (OscillatorNode, GainNode, BiquadFilter). Mengelola suara tembakan, ledakan, dan efek antarmuka tanpa perlu memuat file audio eksternal yang berat.
3. **[`gamedevs/npc_system.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/npc_system.js)**:
   * **Fungsi Utama:** Mengatur kecerdasan buatan (FSM / State Machine) NPC: state *idle*, *patrol*, *chase/aggro*, dan *attack*.
4. **[`gamedevs/main.html`](file:///c:/Users/krisn/Desktop/websss/gamedevs/main.html) & [`gamedevs/index.html`](file:///c:/Users/krisn/Desktop/websss/gamedevs/index.html)**:
   * Menampung elemen `<canvas id="gameCanvas">`, HUD status pemain, dan menghubungkan script modul 2D.
5. **[`gamedevs/style.css`](file:///c:/Users/krisn/Desktop/websss/gamedevs/style.css)**:
   * Layout responsif, styling tema gelap, animasi antarmuka, dan optimasi canvas (`touch-action: none`).

---

### C. Modul Game 3D: Dead Zone (`gamedevs/dead-zone/`)
Game 3D survival zombie berbasis Three.js:
1. **[`gamedevs/dead-zone/js/main.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/main.js)**:
   * Inisialisasi `THREE.Scene`, `THREE.PerspectiveCamera`, dan `THREE.WebGLRenderer`.
   * Menghubungkan semua subsistem (`player`, `zombies`, `weapons`, `waves`, `environment`, `audio`, `ui`).
   * Menjalankan render loop dengan delta time `clock.getDelta()`.
2. **[`gamedevs/dead-zone/js/player.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/player.js)**:
   * Menangani koordinat pergerakan pemain, Pointer Lock Controls untuk rotasi kamera, deteksi tabrakan dengan rintangan, dan status HP pemain.
3. **[`gamedevs/dead-zone/js/weapons.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/weapons.js)**:
   * Mengatur penembakan via `THREE.Raycaster`.
   * Menghitung hitbox zombie, efek recoil kamera, muzzle flash, sistem reload magasin, dan inventaris senjata.
4. **[`gamedevs/dead-zone/js/zombies.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/zombies.js)**:
   * Pool entitas zombie 3D.
   * Logika AI zombie mencari posisi pemain (`lookAt`, interpolasi posisi), animasi gerakan, damage ke pemain saat bersentuhan, dan efek kematian zombie.
5. **[`gamedevs/dead-zone/js/waves.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/waves.js)**:
   * Pengontrol siklus gelombang: menghitung jumlah zombie yang harus di-spawn per wave, interval istirahat antar wave, dan peningkatan health/kecepatan zombie tiap ronde.
6. **[`gamedevs/dead-zone/js/environment.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/environment.js)**:
   * Pembuatan dunia 3D: lantai bertekstur, barikade, pencahayaan atmosfer (`THREE.DirectionalLight`, `THREE.AmbientLight`), dan kabut (`scene.fog`).
7. **[`gamedevs/dead-zone/js/audio.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/audio.js)**:
   * Positional Audio 3D menggunakan Web Audio API / Three.js AudioListener. Suara zombie menjadi lebih keras saat mereka mendekati posisi pemain.
8. **[`gamedevs/dead-zone/js/touchControls.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/touchControls.js)**:
   * Menyediakan joystick virtual di layar sentuh untuk perangkat mobile (analog kiri untuk gerak, analog/swipe kanan untuk bidik & tembak).
9. **[`gamedevs/dead-zone/js/ui.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/ui.js)**:
   * Memperbarui elemen DOM secara dinamis: indikator HP merah, amunisi peluru, counter ronde/wave, serta modal Game Over & Scoreboard.
10. **[`gamedevs/dead-zone/js/libs/three.module.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/libs/three.module.js)**:
    * Library core Three.js versi ES Module yang di-embed secara lokal agar game dapat berjalan offline tanpa koneksi CDN eksternal.

---

## 3. Alur Hubungan Antar Modul (Dependency Graph)

```
[dead-zone/index.html]
       │
       ▼
[js/main.js] (Pusat Orkestrasi)
  ├──► [js/environment.js]  (Membangun peta, rintangan, cahaya)
  ├──► [js/player.js]       (Update posisi pemain & kamera)
  ├──► [js/weapons.js]      (Input klik -> Raycast tembakan -> Hit ke Zombie)
  ├──► [js/zombies.js]      (Kejar player -> Serang jika dalam jarak radius)
  ├──► [js/waves.js]        (Picu spawn zombie baru ke zombies.js)
  ├──► [js/audio.js]        (Picu efek tembakan, pukulan, dan langkah)
  └──► [js/ui.js]           (Update HP bar, jumlah peluru, wave info)
```

---

## 4. Panduan Modifikasi & Debugging

1. **Menambah Senjata Baru:**
   * Edit [`gamedevs/dead-zone/js/weapons.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/weapons.js) pada objek konfigurasi senjata (tentukan `damage`, `fireRate`, `magSize`, `reloadTime`).
   * Daftarkan nama file suara di [`gamedevs/dead-zone/js/audio.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/audio.js).
2. **Menyesuaikan Tingkat Kesulitan Zombie:**
   * Buka [`gamedevs/dead-zone/js/waves.js`](file:///c:/Users/krisn/Desktop/websss/gamedevs/dead-zone/js/waves.js) dan ubah formula penggandaan darah dan kecepatan zombie.
3. **Mengoptimalkan Frame Rate:**
   * Jangan instansiasi mesh atau material Three.js baru di dalam method `update()` atau `render()`. Buat di awal (pre-allocation) dan gunakan sistem pooling.
