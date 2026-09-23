# FocusGuard AI — Telemetri Ruang Kerja Visual & Pola Fokus

> **Mesin Computer Vision On-Device yang Mengutamakan Privasi untuk Analisis Objektif Aktivitas Belajar & Ruang Kerja**

[![Privacy](https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald)](https://github.com)
[![Processing](https://img.shields.io/badge/Processing-Client--Side%20WebRTC-cyan)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

![FocusGuard AI Dashboard](screenshot.png)

## 📑 Daftar Isi
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Pernyataan Masalah & Lingkup Ilmiah](#2-pernyataan-masalah--lingkup-ilmiah)
3. [AI Etis & Penafian Ilmiah](#3-ai-etis--penafian-ilmiah)
4. [Arsitektur Sistem](#4-arsitektur-sistem)
5. [Computer Vision & Pipeline Observasi](#5-computer-vision--pipeline-observasi)
6. [Fase Kalibrasi Ruang Kerja 5 Detik](#6-fase-kalibrasi-ruang-kerja-5-detik)
7. [Aktivitas Temporal & Mesin Timeline Multi-Layer](#7-aktivitas-temporal--mesin-timeline-multi-layer)
8. [Algoritma Matematika Penilaian Pola Fokus](#8-algoritma-matematika-penilaian-pola-fokus)
9. [Pembuatan Ringkasan Naratif AI](#9-pembuatan-ringkasan-naratif-ai)
10. [Desain Mengutamakan Privasi & Jaminan Zero-Cloud](#10-desain-mengutamakan-privasi--jaminan-zero-cloud)
11. [Gamifikasi, Streak & Pencapaian](#11-gamifikasi-streak--pencapaian)
12. [Ekspor Data Komprehensif (JSON & CSV)](#12-ekspor-data-komprehensif-json--csv)
13. [Sistem Desain UI/UX & Glassmorphism](#13-sistem-desain-uiux--glassmorphism)
14. [Struktur Kode](#14-struktur-kode)
15. [Skema TypeScript & Model Data](#15-skema-typescript--model-data)
16. [Panduan Instalasi & Eksekusi](#16-panduan-instalasi--eksekusi)
17. [Kompatibilitas Browser & Optimasi Performa](#17-kompatibilitas-browser--optimasi-performa)
18. [Kasus Ekstrem & Strategi Ketahanan](#18-kasus-ekstrem--strategi-ketahanan)
19. [Kasus Penggunaan Dunia Nyata & Aplikasi](#19-kasus-penggunaan-dunia-nyata--aplikasi)
20. [Peta Jalan Masa Depan & Ekstensibilitas](#20-peta-jalan-masa-depan--ekstensibilitas)

---

## 1. Ringkasan Eksekutif

**FocusGuard AI** adalah aplikasi web computer vision inovatif yang dirancang untuk membantu pekerja berpengetahuan, siswa, dan peneliti mengukur serta meningkatkan kebiasaan belajar dan kerja mereka. Dengan menganalisis streaming video kamera langsung di dalam browser klien, FocusGuard AI memantau **pola aktivitas fisik yang dapat diamati**—seperti kehadiran di ruang kerja, orientasi kepala, postur tubuh, dan interaksi dengan ponsel cerdas—tanpa mengirimkan data video apa pun melalui jaringan.

FocusGuard AI memberikan **Skor Pola Fokus (0–100)** empiris yang objektif dan timeline aktivitas multi-layer berstempel waktu, disertai dengan narasi observasional terstruktur yang memberdayakan pengguna untuk mengenali kebiasaan yang menyebabkan gangguan.

---

## 2. Pernyataan Masalah & Lingkup Ilmiah

### Epidemi Gangguan dalam Pekerjaan & Pembelajaran Jarak Jauh
Pekerjaan berpengetahuan modern penuh dengan interupsi digital dan fisik. Studi mengungkapkan bahwa setelah adanya interupsi, rata-rata dibutuhkan **23 menit dan 15 detik** bagi seseorang untuk kembali ke fokus mendalam. Namun, perangkat lunak produktivitas yang ada saat ini utamanya mengandalkan metrik tumpul (misalnya pemblokir situs web atau pelacak klik keyboard) yang gagal menangkap gangguan fisik (seperti mengambil ponsel cerdas, bersandar menjauh, atau meninggalkan ruang kerja).

### Batasan Ilmiah
FocusGuard AI menjembatani kesenjangan ini dengan menyediakan **telemetri fisik ruang kerja** sambil secara ketat mempertahankan batasan etis dan ilmiah:
- **Apa yang Diukur FocusGuard AI:** Kotak pembatas spasial (bounding boxes), yaw/pitch kepala, transisi postur, waktu yang dihabiskan untuk menghadap layar vs. menjauh, kehadiran objek ponsel yang berkelanjutan, dan saat keluar dari ruang kerja.
- **Apa yang TIDAK PERNAH Diklaim FocusGuard AI:** Kognisi internal, emosi, perasaan, kecerdasan, psikologi, atau evaluasi moral dari produktivitas.

---

## 3. AI Etis & Penafian Ilmiah

> [!IMPORTANT]
> **Bahasa Observasional Ketat & Batasan Etis**
> FocusGuard AI mematuhi standar AI etis tertinggi:
> 1. **Tidak Membaca Pikiran atau Menilai Niat:** Aplikasi ini beroperasi secara eksklusif pada telemetri visual. Aplikasi mencatat *bahwa* seseorang menoleh, bukan *mengapa* mereka melakukannya.
> 2. **Tidak Menyimpulkan Emosi:** Mesin tidak mengategorikan ekspresi wajah sebagai kondisi psikologis (misalnya kebahagiaan, frustrasi, kebosanan).
> 3. **Terminologi Non-Menghakimi:** Telemetri digambarkan sebagai `"perhatian terpantau mengarah ke ruang kerja"` atau `"posisi kepala bergeser menjauh"`, alih-alih `"bermalas-malasan"` atau `"tidak produktif"`.
> 4. **Tidak Ada Identifikasi Biometrik:** Tidak ada embedding wajah atau profil biometrik yang dibuat, disimpan, atau dicocokkan.

---

## 4. Arsitektur Sistem

FocusGuard AI mengikuti pipeline modular sisi klien yang mengeksekusi pada 15–30 FPS pada perangkat keras konsumen:

```mermaid
graph TD
    A[Streaming Video Webcam] --> B[CameraManager]
    B --> C[WorkspaceDetector (Kalibrasi 5d)]
    C --> D[PostureTracker]
    C --> E[AttentionTracker]
    C --> F[DistractionDetector]
    
    D --> G[Buffer ActivityTimeline]
    E --> G
    F --> G
    
    G --> H[FocusPatternEngine (Penilaian Matematika)]
    G --> I[Timeline Canvas Multi-Layer]
    
    H --> J[AISummaryGenerator (Telemetri Naratif)]
    J --> K[Laporan Sesi & LocalStore (Streak/Riwayat)]
```

---

## 5. Computer Vision & Pipeline Observasi

1. **Deteksi Orang & Kotak Pembatas (Bounding Box)**:
   - Menemukan keypoint tubuh bagian atas dan kepala dalam bingkai (frame).
   - Menghitung pusat kotak pembatas relatif `(cx, cy)`, rasio aspek, dan area kotak pembatas.
2. **Estimasi Kondisi Postur**:
   - Mengklasifikasikan postur yang diamati ke dalam `Duduk (Nominal)`, `Berdiri`, `Condong ke Depan/Membungkuk`, `Gerakan Lateral Berat`, atau `Keluar Ruang Kerja / Absen`.
3. **Pelacakan Arah Kepala & Perhatian**:
   - Mengukur vektor perpindahan hidung-ke-pusat-mata dan rasio yaw/pitch.
   - Mengategorikan perhatian ke `Tengah (Layar)`, `Kiri`, `Kanan`, `Bawah (Meja/Perangkat)`, atau `Atas`.
4. **Deteksi Gangguan & Objek**:
   - Mendeteksi petunjuk visual yang menjadi karakteristik penggunaan ponsel cerdas (tangan terangkat di dekat wajah dengan tatapan ke bawah).
   - Menerapkan ambang batas debounce temporal (minimal 2,5 detik interaksi berkelanjutan) sebelum memicu tanda gangguan.

---

## 6. Fase Kalibrasi Ruang Kerja 5 Detik

Untuk mengakomodasi berbagai sudut kamera, tinggi kursi, dan tata letak meja, FocusGuard AI menyertakan **rutinitas kalibrasi adaptif 5 detik**:
- **Penetapan Dasar (Baseline):** Mengambil sampel 75–150 bingkai saat pengguna duduk dalam posisi kerja alami mereka.
- **Batas Parametrik:** Menghitung tinggi kepala dasar ($Y_{\text{base}}$), skala kepala ($S_{\text{base}}$), simetri garis mata, dan batas pembatas ambien.
- **Toleransi Dinamis:** Perhitungan postur selanjutnya mengukur penyimpangan dari garis dasar yang dikalibrasi alih-alih koordinat absolut arbitrer.

---

## 7. Aktivitas Temporal & Mesin Timeline Multi-Layer

FocusGuard merekam buffer deret waktu bergulir dari cuplikan mikro (granularitas `1 Hz`) yang menangkap:
- **Trek 1: Kehadiran & Postur** (Nominal, Membungkuk, Bergerak, Absen)
- **Trek 2: Orientasi Perhatian** (Layar, Kiri, Kanan, Bawah, Atas)
- **Trek 3: Kejadian Gangguan** (Penggunaan ponsel, Meninggalkan ruang kerja)
- **Trek 4: Skor Intensitas Fokus Sesaat** (0–100%)

Timeline dirender secara real-time ke HTML5 Canvas menggunakan visualisasi spektral berkode 4 warna.

---

## 8. Algoritma Matematika Penilaian Pola Fokus

**Skor Pola Fokus** $S \in [0, 100]$ dihitung sebagai komposit harmonik berbobot dari tiga faktor observasi utama:

$$S = \left( w_A \cdot S_{\text{attention}} + w_P \cdot S_{\text{posture}} - P_{\text{distraction}} \right) \times C_{\text{presence}}$$

Di mana:
- $S_{\text{attention}} = \frac{T_{\text{center}} + 0.5 \cdot T_{\text{peripheral}}}{T_{\text{present}}}$ (Skor arah perhatian)
- $S_{\text{posture}} = 1.0 - \left(\frac{T_{\text{slouch}} \times 0.25 + T_{\text{excessive\_movement}} \times 0.4}{T_{\text{present}}}\right)$ (Skor stabilitas postur)
- $P_{\text{distraction}} = \text{Penalti untuk gangguan ponsel/eksternal yang berkelanjutan}$
- $C_{\text{presence}} = \frac{T_{\text{present}}}{T_{\text{total}}}$ (Rasio kehadiran ruang kerja)
- Bobot default: $w_A = 65\%$, $w_P = 35\%$.

---

## 9. Pembuatan Ringkasan Naratif AI

Saat sesi berakhir, `AISummaryGenerator` menerjemahkan vektor matematika mentah menjadi narasi markdown observasional terstruktur:
- **Ringkasan Eksekutif**: Total durasi, menit fokus aktif, persentase gangguan.
- **Observasi Visual Utama**: Distribusi postur (misalnya, "78% duduk nominal, 12% condong ke depan"), frekuensi pergeseran kepala, jumlah peninggalan ruang kerja.
- **Wawasan Optimasi yang Dapat Ditindaklanjuti**: Saran empiris (misalnya, "Pergeseran tatapan ke bawah yang sering terdeteksi di paruh kedua sesi—pertimbangkan untuk memposisikan referensi sekunder setinggi mata").

---

## 10. Desain Mengutamakan Privasi & Jaminan Zero-Cloud

```
+-------------------------------------------------------------+
|                     PERANGKAT LOKAL PENGGUNA                |
|                                                             |
|  [Webcam] ---> [Mesin CV FocusGuard] ---> [LocalStorage]    |
|                         |                                   |
|                         v                                   |
|                  [Rendering Canvas]                         |
+-------------------------------------------------------------+
                              X  (TIDAK ADA LALU LINTAS INTERNET)
                              v
                      [Server Cloud Jarak Jauh]
```

- **Nol Ingesti Frame di Cloud:** Bingkai video tidak pernah meninggalkan GPU/RAM lokal.
- **Tidak Memerlukan Akun:** Berjalan sepenuhnya secara lokal tanpa cookie pelacakan pihak ketiga atau suar analitik eksternal.
- **Kedaulatan Data:** Penghapusan sesi dengan satu klik membersihkan semua catatan basis data lokal secara instan.

---

## 11. Gamifikasi, Streak & Pencapaian

FocusGuard AI menyertakan modul gamifikasi bawaan untuk memperkuat kebiasaan belajar yang konsisten:
- **Streak Fokus Harian:** Bertambah secara otomatis saat setidaknya satu sesi $\ge 15$ menit diselesaikan dalam waktu 24 jam.
- **Lencana Pencapaian yang Dapat Diperoleh:**
  - 🏁 *Langkah Pertama*: Menyelesaikan sesi fokus pertama.
  - 🧘 *Master Zen*: Mempertahankan $\ge 90\%$ skor fokus selama lebih dari 25 menit.
  - 🛡️ *Fokus Besi*: Menyelesaikan sesi 45+ menit tanpa meninggalkan ruang kerja.
  - 🏆 *Juara Konsistensi*: Mempertahankan streak fokus 7 hari.

---

## 12. Ekspor Data Komprehensif (JSON & CSV)

Pengguna dapat mengekspor riwayat analitis lengkap mereka kapan saja:
- **Ekspor JSON:** Skema hierarkis penuh termasuk cuplikan timeline tingkat frame, rincian postur, dan ringkasan AI.
- **Ekspor CSV:** Log sesi tabular yang cocok untuk diimpor ke Microsoft Excel, Google Sheets, R, atau Python Pandas untuk penelitian longitudinal.

---

## 13. Sistem Desain UI/UX & Glassmorphism

Antarmuka pengguna dibangun berdasarkan prinsip desain glassmorphism cyber-dark modern:
- **Palet Warna:** Token gelap HSL yang dikurasi (latar belakang slate `#0a0d14`, aksen indigo `#6366f1`, sorotan fokus emerald `#10b981`, peringatan gangguan `#f43f5e`).
- **Tipografi:** Google Outfit & Inter untuk keterbacaan tinggi, dipasangkan dengan JetBrains Mono untuk metrik telemetri.
- **Overlay HUD Tercermin (Mirrored):** Kotak pembatas langsung (live bounding boxes), panah vektor tatapan, dan pil status diproyeksikan langsung di atas feed webcam yang dicerminkan dengan orientasi teks yang benar.

---

## 14. Struktur Kode

```
focusguard-ai/
├── css/
│   └── style.css            # Sistem desain glassmorphic cyber-dark
├── js/
│   └── bundle.js            # Bundle runtime mandiri tanpa dependensi
├── src/
│   ├── types/
│   │   └── index.ts         # Kontrak data & skema TypeScript
│   ├── vision/
│   │   ├── CameraManager.ts       # Tangkapan video WebRTC & loop FPS
│   │   ├── WorkspaceDetector.ts   # Mesin kalibrasi 5 detik
│   │   ├── PostureTracker.ts      # Pengklasifikasi postur biomekanik
│   │   ├── AttentionTracker.ts    # Estimator tatapan & yaw/pitch kepala
│   │   └── DistractionDetector.ts # Mesin debounce gangguan berkelanjutan
│   ├── analysis/
│   │   ├── ActivityTimeline.ts    # Buffer multi-trek & perender canvas
│   │   ├── FocusPatternEngine.ts  # Algoritma penilaian objektif
│   │   └── AISummaryGenerator.ts  # Penulis laporan observasional
│   ├── storage/
│   │   └── LocalStore.ts          # CRUD LocalStorage, streak & lencana
│   └── App.ts                     # Orkestrator utama
├── index.html               # Markup dasbor utama
├── package.json             # Konfigurasi build
├── tsconfig.json            # Konfigurasi kompiler TypeScript
└── README.md                # Dokumentasi komprehensif
```

---

## 15. Skema TypeScript & Model Data

Semua transisi keadaan dan kejadian telemetri mematuhi antarmuka TypeScript yang ketat:

```typescript
export type PostureState = 'nominal_seated' | 'standing' | 'slouching' | 'heavy_movement' | 'absent';
export type AttentionDirection = 'center_screen' | 'left' | 'right' | 'down_desk' | 'up';
export type DistractionType = 'none' | 'smartphone' | 'sustained_away' | 'workspace_exit';

export interface TimelineSnapshot {
  timestamp: number;
  relativeSeconds: number;
  posture: PostureState;
  attention: AttentionDirection;
  distraction: DistractionType;
  instantScore: number;
}

export interface SessionReportData {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  focusScore: number;
  timeline: TimelineSnapshot[];
  postureBreakdown: Record<PostureState, number>;
  attentionBreakdown: Record<AttentionDirection, number>;
  summaryNarrative: string;
}
```

---

## 16. Panduan Instalasi & Eksekusi

### Opsi 1: Eksekusi File Langsung (Tanpa Instalasi)
Klik ganda `index.html` di browser web modern mana pun.

### Opsi 2: Server Pengembangan Lokal
```bash
# Navigasi ke direktori
cd focusguard-ai

# Instal dependensi (opsional untuk kompilasi)
npm install

# Jalankan server pengembangan lokal
npm run dev
```

---

## 17. Kompatibilitas Browser & Optimasi Performa

- **Browser yang Didukung:** Chrome 90+, Edge 90+, Firefox 88+, Safari 14.1+, Opera 76+.
- **Throttling FPS & Loop Adaptif:** Secara otomatis membatasi analisis saat visibilitas tab berubah (`document.hidden`) untuk menghemat CPU dan baterai.
- **Akselerasi Perangkat Keras Canvas:** Menggunakan rutinitas menggambar buffer langsung 2D tanpa overhead Garbage Collection (GC).

---

## 18. Kasus Ekstrem & Strategi Ketahanan

| Skenario | Strategi Penanganan Kasus Ekstrem |
| :--- | :--- |
| **Kondisi Cahaya Rendah** | Memberitahu pengguna tentang penurunan kepercayaan (confidence); mencegah tanda gangguan palsu. |
| **Pengaturan Monitor Ganda** | Kalibrasi 5 detik memungkinkan pengguna untuk memusatkan perhatian melintasi sudut layar ganda. |
| **Bersin / Menggaruk Singkat** | Jendela debounce 2,5 detik mencegah gerakan mikro sesaat agar tidak mengubah skor. |
| **Kamera Tiba-tiba Terputus** | Penangan catch WebRTC menghentikan sementara sesi dengan anggun dan menyimpan buffer historis. |

---

## 19. Kasus Penggunaan Dunia Nyata & Aplikasi

1. **Belajar Mandiri (Peningkatan Pomodoro)**: Umpan balik visual selama sesi sprint kerja mendalam 25 menit.
2. **Kesadaran Postur Ergonomis**: Mengidentifikasi saat membungkuk terlalu lama dan mendorong pergerakan berkala.
3. **Penelitian Akademik**: Studi longitudinal yang mengevaluasi teknik pelestarian perhatian.

---

## 20. Peta Jalan Masa Depan & Ekstensibilitas

- [ ] **Integrasi WebAssembly / MediaPipe Face Mesh** untuk pelacakan pupil sub-derajat.
- [ ] **Telemetri Cahaya Ambien & Kebisingan Akustik** untuk audit lingkungan ruang kerja yang komprehensif.
- [ ] **Sinkronisasi Detak Jantung Perangkat Dapat Dipakai** untuk studi korelasi biometrik multi-modal.

---

<p align="center">
  <strong>FocusGuard AI</strong> — Dibangun dengan integritas, presisi, dan privasi.
</p>
