# Folder .agents/

Folder ini digunakan oleh AI coding assistant (seperti Antigravity, Claude Code, Codex, dan Cursor) untuk mengenali kemampuan (skills) dan aturan khusus yang berlaku di proyek **websss**.

## Struktur:
```
websss/
└── .agents/
    ├── README.md
    └── skills/
        └── web-gamedev/
            └── SKILL.md
```

## Cara Menambah Skill Baru:
1. Buat folder baru di dalam `.agents/skills/<nama-skill>/`.
2. Buat file `SKILL.md` dengan frontmatter:
   ```yaml
   ---
   name: nama-skill
   description: Use when... (kapan skill ini harus digunakan oleh AI)
   ---

   # Judul Skill
   Instruksi, pola koding, dan langkah-langkah implementasi...
   ```
3. AI akan otomatis mendeteksi skill tersebut pada saat Anda membuka proyek ini.

