# Sci-Fi FPS Survival & Economic Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merombak game Three.js menjadi Sci-Fi FPS Survival dengan ekosistem 2 peta (Neo-Haven Safe Zone & Sector-7 Wasteland), sistem ekonomi mata uang Rupiah (Rp), kepemilikan Safehouse (Hab Pod) dengan peti penyimpanan permanen (Stash), sistem upgrade tas, kios perdagangan, penjarahan kontainer, perburuan mutan, dan penalti kehilangan seluruh isi tas ransel saat mati di medan bahaya.

**Architecture:** Arsitektur modular berbasis ES Modules Three.js native tanpa bundler. Menggunakan `gameState.js` sebagai single-source-of-truth ekonomi dan inventaris dengan persistensi `localStorage`, `environment.js` dengan arsitektur dual-scene graph terpisah (Safe Zone vs Wasteland) untuk transisi instan tanpa reload browser, `shops.js` & `ui.js` untuk modal interaksi kios dan HUD bergaya sci-fi neon, serta `loot.js` & `zombies.js` untuk siklus looting, extraction beacon, dan high-stakes death penalty.

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+ Modules), Three.js (r128), Web Audio API (prosedural sound synthesis).

**Spec:** `C:\Users\krisn\.gemini\antigravity\brain\7b458736-b199-4cc5-9791-026bf81e159b\design_spec_scifi_survival_economy.md`

## Global Constraints

- **Mata Uang:** Wajib selalu diformat sebagai **Rupiah** atau **Rp** (contoh: `Rp 15.000`, `Rp 150.000`), tidak boleh menggunakan Dollar ($) atau koin generik.
- **Perspektif Kamera:** Wajib First-Person Shooter (FPS) murni menggunakan Three.js yaw/pitch controls.
- **Gaya Visual:** Bertema Sci-Fi cerah/berwarna (Neo-Haven: kubah energi, platform modular, lampu neon Cyan/Amber/Magenta; Sector-7: langit senja keemasan, formasi kristal berpendar, puing kargo).
- **Penalti Kematian (High Stakes):** Kematian di Map 2 (Sector-7) menghapus seluruh isi tas ransel ekspedisi; barang di Storage Stash rumah, senjata yang dimiliki, dan saldo Rupiah tetap aman.
- **Runtime:** Native browser ES Module via `<script type="module">` dan `importmap` Three.js lokal; tidak memerlukan Node.js build step/bundler agar langsung dapat dimainkan di web server lokal maupun mobile.

## Review Focus

1. **Backpack Overflow pada Looting:** Mengambil item saat kapasitas tas penuh (misal 6/6) tidak boleh menghilangkan item di dunia atau merusak array ransel; harus menampilkan notifikasi "Tas Penuh!".
2. **Transfer Item Stash <-> Ransel saat Stash Penuh:** Memindahkan item dari tas ke peti saat kapasitas stash penuh (16/16) harus ditolak secara anggun tanpa menduplikasi atau menghapus item.
3. **Pembelian Tanpa Saldo Cukup:** Membeli amunisi, senjata, atau upgrade tas/rumah saat saldo Rupiah kurang tidak boleh mengurangi uang ke nilai negatif atau memberikan item secara cuma-cuma.
4. **Transisi Peta Bersih (Memory & Object Leak):** Beralih antara Safe Zone dan Sector-7 tidak boleh menyebabkan duplikasi pencahayaan, tabrakan zombie di safe zone, atau kebocoran memori Three.js.
5. **Death Cleanup & Respawn:** Saat tewas di Sektor 7, loop pertempuran harus berhenti seketika, menghapus item ransel ekspedisi, mereset status pemain, dan memindahkan pemain kembali ke dalam Safehouse di Safe Zone.

---

### Task 1: Core Game State, Economy, Inventory & Storage Engine

**Files:**
- Create: `gamedevs/dead-zone/js/gameState.js`
- Test: `gamedevs/dead-zone/js/tests/gameState.test.js`

**Interfaces:**
- Consumes: None (independent foundational state module)
- Produces: `GameState` object containing:
  - `wallet`: number (saldo Rupiah, initial `50000`)
  - `backpack`: Array<{ id: string, name: string, type: string, count: number, value: number, icon: string }>
  - `backpackMaxSlots`: number (default `6`, upgrades: `10`, `16`)
  - `stash`: Array<{ id: string, name: string, type: string, count: number, value: number, icon: string }>
  - `stashMaxSlots`: number (default `16`, upgrades: `32`, `64`)
  - `houseLevel`: number (`1`, `2`, `3`)
  - `activeZone`: string (`"safe_zone"` | `"sector_7"`)
  - `formatRp(amount: number): string`
  - `addItemToBackpack(item: object): boolean`
  - `removeItemFromBackpack(index: number, count?: number): object | null`
  - `transferToStash(backpackIndex: number): boolean`
  - `transferToBackpack(stashIndex: number): boolean`
  - `canAfford(cost: number): boolean`
  - `deductRp(cost: number): boolean`
  - `addRp(amount: number): void`
  - `upgradeBackpack(): { success: boolean, message: string }`
  - `upgradeHouse(): { success: boolean, message: string }`
  - `clearBackpackOnDeath(): Array<object>` (mengembalikan item yang hilang dan mengosongkan backpack)
  - `saveToStorage(): void`
  - `loadFromStorage(): void`

- [x] **Step 1: Write test suite for GameState logic**
Buat file `gamedevs/dead-zone/js/tests/gameState.test.js` berisi pengujian:
- Inisialisasi awal (saldo Rp 50.000, tas 6 slot, stash 16 slot, house level 1).
- Format rupiah `formatRp(150000)` mengembalikan `"Rp 150.000"`.
- `addItemToBackpack` menambah item hingga batas kapasitas dan menolak jika melebihi batas.
- `transferToStash` memindahkan item dari tas ke stash dengan aman.
- `clearBackpackOnDeath` mengosongkan seluruh isi tas tetapi mempertahankan saldo dompet dan isi stash.
- Upgrade tas dari 6 ke 10 slot memotong Rp 150.000.
- Upgrade rumah memotong Rp 300.000 + 5 Scrap Metal dan menaikkan stash ke 32 slot.

- [x] **Step 2: Run test in Node or browser runner to verify failure**
Jalankan tes menggunakan node atau mini runner:
Command: `node gamedevs/dead-zone/js/tests/gameState.test.js`
Expected: FAIL dengan pesan modul atau fungsi belum ditemukan.

- [x] **Step 3: Implement `gameState.js`**
Tulis modul `gamedevs/dead-zone/js/gameState.js` dengan:
- Kamus definisi item (`ITEMS`): `SCRAP_METAL` (Rp 15.000), `POWER_CONVERTER` (Rp 40.000), `BIO_TISSUE` (Rp 25.000), `XENON_CORE` (Rp 80.000), `NANO_STIM` (Rp 30.000), `PLASMA_AMMO` (Rp 20.000).
- State manajemen dengan penyimpanan `localStorage.getItem('SCIFI_GAMESTATE')`.
- Logika validasi batas kapasitas slot tas dan stash.
- Logika penalti kematian `clearBackpackOnDeath()`.

- [x] **Step 4: Run test to verify it passes**
Command: `node gamedevs/dead-zone/js/tests/gameState.test.js`
Expected: PASS seluruh tes assert berhasil tanpa error.

---

### Task 2: Dual-Zone Environment & Visual Atmosphere Engine

**Files:**
- Create: `gamedevs/dead-zone/js/environment_dual.js`
- Test: Verifikasi visual via browser (Playwright screenshot atau DOM canvas check)

**Interfaces:**
- Consumes: `THREE`, `scene`, `renderer`
- Produces: `EnvironmentDual` object with methods:
  - `init(scene: THREE.Scene): void`
  - `buildSafeZone(): THREE.Group`
    - Kubah energi bercahaya (wireframe/emissive inverted dome).
    - Platform modular baja sci-fi dengan garis neon Cyan/Magenta.
    - Struktur Bangunan:
      - 🏠 Rumah Pemain (Hab Pod) dengan pintu dan interior peti stash.
      - 🛡️ Kios Armory (Terminal senjata & tas dengan hologram warna oranye).
      - 💊 Kios Med-Bay (Stasiun medis berhologram hijau).
      - 💰 Kios Scrap Exchange (Terminal pengepul rongsokan berhologram kuning).
      - 🚪 Air-Lock Gate (Gerbang heksagonal dengan partikel teleporter menuju Sector-7).
  - `buildSector7(): THREE.Group`
    - Langit senja keemasan (*warm dusk gradient fog & background*).
    - Terrain gurun pasir alien bergelombang dan tebing batu oranye-cokelat.
    - Formasi kristal energi berpendar (*cyan/purple luminescent crystals*).
    - Kontainer kargo terbengkalai dan puing kapal luar angkasa.
    - 🛸 Extraction Beacon (Menara mercusuar vertikal dengan pilar sinar laser ke langit).
  - `switchToZone(zoneName: "safe_zone" | "sector_7", player: object): void`
    - Mengatur `scene.fog`, `scene.background`, dan visibilitas grup map terkait.
    - Memindahkan posisi pemain ke titik spawn yang tepat (Safehouse Spawn vs Drop Pod Spawn).
  - `getColliders(): Array<THREE.Box3 | object>`
  - `getInteractables(): Array<{ id: string, type: string, position: THREE.Vector3, radius: number, label: string }>`

- [x] **Step 1: Write verification script for scene builder**
Buat skrip pengujian pemuatan objek lingkungan untuk memvalidasi pembuatan grup Safe Zone dan Sector-7 tanpa error grafis Three.js.

- [x] **Step 2: Implement `environment_dual.js`**
Tulis arsitektur grafis 3D modular Three.js:
- Pembuatan material PBR procedural (lempeng logam berpola grid, material kristal berpendar emissive, batuan gurun bertekstur noise).
- Grup `safeZoneGroup` dan `sector7Group` yang dapat di-toggle `visible = true/false` agar hemat alokasi memori dan menjaga 60 FPS stabil.
- Pencahayaan spesifik per zona: Ambient neon seimbang di Safe Zone; Directional sunlight senja keemasan dengan bayangan di Sector-7.
- Koleksi titik interaksi (`interactables`): Hab Pod Door, Stash Chest, Armory, Med-Bay, Scrap Exchange, Air-Lock, Cargo Crates, Extraction Beacon.

- [x] **Step 3: Verify environment rendering**
Buka game di browser dan pastikan kedua peta dapat dibangun serta beralih tanpa drop frame atau duplikasi node di Three.js scene graph.

---

### Task 3: Kiosks, Safehouse & Economy UI System

**Files:**
- Create: `gamedevs/dead-zone/js/shops.js`
- Modify: `gamedevs/dead-zone/js/ui.js`
- Modify: `gamedevs/dead-zone/css/style.css` (tata letak modal UI sci-fi neon)

**Interfaces:**
- Consumes: `gameState.js`, `audio.js`
- Produces:
  - `InteractionManager`: mendeteksi objek terdekat dalam radius 3 meter dan menampilkan prompt `[E] <Label>`.
  - `openSafehouseModal()`: Dialog antarmuka Peti Penyimpanan (Stash) dua kolom (Tas Ransel vs Peti Rumah), tombol Transfer item, dan tombol Upgrade Rumah dengan rincian biaya Rp & bahan.
  - `openArmoryModal()`: Pembelian amunisi plasma (Rp 20.000), upgrade ransel (Rp 150.000 / Rp 400.000), dan pembelian senjata baru.
  - `openMedBayModal()`: Pembelian Nano-Stim Potion (Rp 30.000) dan pengisian darah kilat.
  - `openScrapExchangeModal()`: Daftar jarahan di tas, harga jual per unit dalam Rp, dan tombol "Jual Semua Jarahan (Quick Sell)".
  - `updateHUD()`: Menampilkan saldo Rupiah (`Rp xxx.xxx`), indikator zona aktif, jumlah slot tas terisi (`x / max`), dan stok Nano-Stim Potion (`[Q] x`).

- [x] **Step 1: Style the Sci-Fi UI Modals in CSS**
Tambahkan kelas CSS bergaya cyberpunk sci-fi (latar belakang gelap transparan `rgba(10, 15, 25, 0.92)`, border neon cyan, tombol amber, font monospace futuristik).

- [x] **Step 2: Implement modal view controllers in `shops.js`**
Tulis fungsi render HTML interaktif untuk Safehouse/Stash, Armory, Med-Bay, dan Scrap Exchange. Setiap transaksi memeriksa saldo Rupiah dan kapasitas slot melalui `gameState`.

- [x] **Step 3: Update `ui.js` & integrate prompt interaction**
Integrasikan event listener tombol `[E]` dan tombol interaksi layar sentuh untuk membuka modal yang relevan saat pemain berada di dekat terminal.

- [x] **Step 4: Verify UI transactions**
Buka kios di browser, lakukan transaksi beli peluru, simpan barang ke stash, dan jual hasil scrap; pastikan saldo Rupiah terpotong dan bertambah sesuai spesifikasi tabel.

---

### Task 4: Player Controller, Potion Usage & Safe-Zone Mode

**Files:**
- Modify: `gamedevs/dead-zone/js/player.js`
- Modify: `gamedevs/dead-zone/js/weapons.js`
- Modify: `gamedevs/dead-zone/js/audio.js`

**Interfaces:**
- Consumes: `gameState.js`, `environment_dual.js`
- Produces:
  - `player.useNanoStim()`: Mengurangi 1 Nano-Stim dari ransel, memulihkan +40 HP (maks 100 HP), memainkan efek audio sci-fi stim injector, menampilkan efek layar heksagonal hijau.
  - `weapons.setHolstered(boolean)`: Senjata diturunkan saat `activeZone === "safe_zone"`, crosshair disembunyikan, klik tembak dicegah; senjata aktif kembali saat berada di `sector_7`.
  - Hotkey handling: Tombol `[Q]` untuk pemakaian instan potion, tombol `[E]` untuk interaksi lingkungan.
  - Audio sintetis Web Audio API baru: Suara stim injector, koin/uang Rupiah, suara gerbang teleport, dan ekstraksi.

- [x] **Step 1: Add new procedural Web Audio sounds in `audio.js`**
Tambahkan fungsi sintetis Web Audio:
- `playStimSound()`: nada modulasi pitch naik frekuensi tinggi (efek regenerasi sci-fi).
- `playCoinSound()`: nada gemerincing elektronik keping Rupiah.
- `playTeleportSound()`: sapuan filter low-pass synth sci-fi.
- `playChestOpenSound()`: suara hidrolik membuka peti.

- [x] **Step 2: Implement holstered mode & potion trigger in `player.js` and `weapons.js`**
- Hubungkan event keyboard `KeyQ` ke pemanggilan `player.useNanoStim()`.
- Tambahkan status `isHolstered` pada `weapons.js` yang menyembunyikan mesh senjata atau menurunkannya ke bawah pandangan kamera saat berada di Safe Zone.

- [x] **Step 3: Verify controls**
Uji tekan `[Q]` ketika memiliki Nano-Stim (HP bertambah) dan saat tidak memiliki (muncul pesan peringatan). Uji klik mouse di Safe Zone (tidak ada peluru yang ditembakkan).

---

### Task 5: Sector-7 Mutants, Loot Containers, Extraction & High-Stakes Death

**Files:**
- Create: `gamedevs/dead-zone/js/loot.js`
- Modify: `gamedevs/dead-zone/js/zombies.js`
- Modify: `gamedevs/dead-zone/js/main.js`

**Interfaces:**
- Consumes: `gameState.js`, `environment_dual.js`, `player.js`, `audio.js`
- Produces:
  - `LootManager`:
    - Mengelola kontainer kargo di Sector-7 (dapat di-loot dengan `[E]` jika ada slot tas tersisa).
    - Mengelola item drop 3D dari mutan yang mati (Bio-Tissue 60%, Xenon Core 25%, Plasma Ammo 40%) dengan ikon kubus bercahaya berputar.
  - `ExtractionManager`:
    - Mendeteksi pemain di zona Extraction Beacon di Sector-7.
    - Countdown 3 detik / konfirmasi `[E]` -> Teleport kembali ke Safe Zone Neo-Haven membawa semua isi tas utuh.
  - `handlePlayerDeath()`:
    - Jika tewas di `safe_zone`: hanya respawn di ranjang Hab Pod.
    - Jika tewas di `sector_7`:
      - Panggil `gameState.clearBackpackOnDeath()` (seluruh isi ransel hangus).
      - Tampilkan modal Game Over merah: *"EKSPEDISI GAGAL — Anda tewas di Sektor-7. Semua jarahan di ransel hilang. Item di Safehouse tetap aman."*
      - Teleport kembali ke Safehouse di Safe Zone dengan HP penuh dan amunisi awal.

- [x] **Step 1: Implement `loot.js`**
Buat sistem spawn kontainer kargo dan drop pickup item 3D saat musuh gugur.
- [x] **Step 2: Update `zombies.js` for Sector-7 spawning & drop hook**
Mutan hanya spawn saat `gameState.activeZone === "sector_7"`. Saat mutan mati (`die()`), panggil `lootManager.spawnDrop(mutantPosition)`.
- [x] **Step 3: Implement extraction beacon & high-stakes death loop in `main.js`**
Kaitkan deteksi ekstraksi dan logika penalti kematian dengan pembersihan tas ransel secara akurat.
- [x] **Step 4: Verify the full gameplay loop**
Lakukan playtest lengkap: Masuk Air-Lock -> tiba di Sector-7 -> berburu mutan -> ambil loot -> coba tewas (cek tas kosong & barang stash aman) -> ulangi ekspedisi -> ekstraksi sukses -> jual loot di Scrap Exchange -> terima Rupiah.

---

### Task 6: Verification & Integration Testing

**Files:**
- Create: `gamedevs/dead-zone/js/tests/integration.test.js`
- Manual Verification: Playtest di browser desktop dan mobile touch mode.

- [x] **Step 1: Run automated unit & state tests**
Command: `node gamedevs/dead-zone/js/tests/gameState.test.js`
Expected: All assertions pass.

- [x] **Step 2: Verify browser gameplay & UI responsiveness**
Buka `http://localhost:.../gamedevs/dead-zone/index.html` dan verifikasi:
- Visual 2 peta (Safe Zone neon vs Sector-7 senja kristal).
- Teks mata uang konsisten menampilkan "Rp".
- Tidak ada error JavaScript pada console browser.
- 60 FPS tercapai tanpa kebocoran memori.

---

