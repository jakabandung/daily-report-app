# WorkLog Pro - Aplikasi Daily Report Tim & Karyawan

Aplikasi web modern, responsif, dan siap pakai untuk pencatatan laporan kerja harian (*daily report*) bagi tim dan kantor. Memudahkan staf mengirimkan laporan aktivitas harian serta membantu pimpinan/supervisor memantau progres kerja, mendeteksi kendala (*blockers*), dan merekap data ke Excel atau PDF.

---

## 🚀 Fitur Utama

1. **📝 Form Input Laporan Harian (Staf / Karyawan)**
   - Input tanggal, nama lengkap, divisi/departemen, dan mode kerja (WFO/WFH/Lapangan).
   - Jam kerja mulai & selesai.
   - Daftar tugas selesai hari ini (dengan bullet point format otomatis).
   - Tugas yang sedang berjalan (*in progress*).
   - **Indikator Kendala / Blocker**: Tandai jika ada kendala pekerjaan agar pimpinan segera mengetahui dan membantu follow-up.
   - Rencana prioritas kerja besok.
   - Indikator kondisi / mood kerja harian.

2. **📊 Dashboard Rekap & Analitik (Pimpinan / Lead View)**
   - **4 Kartu Metrik KPI**: Total laporan hari ini, alert laporan berkendala, jumlah staf aktif, dan arsip tersimpan.
   - **Grafik Interaktif**:
     - Diagram lingkaran (*doughnut chart*) persebaran laporan per divisi.
     - Diagram batang tren kepatuhan submit 7 hari terakhir.
   - **Feed Real-Time**: Daftar staf yang sudah mengirim laporan hari ini dengan badge status instan.

3. **🗂️ Arsip, Filter, dan Pencarian**
   - Pencarian cepat berdasarkan nama staf atau kata kunci tugas.
   - Filter berdasarkan divisi, status kendala (Lancar / Ada Kendala), dan tanggal tertentu.
   - Detail view modal lengkap untuk melihat isi laporan secara komprehensif.

4. **📥 Export Rekap Laporan**
   - **Export Excel (.xlsx)**: File Excel rapi dengan lebar kolom otomatis menggunakan SheetJS.
   - **Cetak / Export PDF**: Layout dokumen resmi perusahaan yang bersih, siap simpan ke PDF atau dicetak (*print-friendly*).
   - **Download CSV**: Format data mentah standar UTF-8 dengan BOM (kompatibel langsung dengan Microsoft Excel).

---

## 🛠️ Teknologi yang Digunakan

- **Backend**: Python 3 (Flask + SQLite3 bawaan)
- **Frontend**: HTML5, Tailwind CSS (CDN), Vanilla JavaScript modern
- **Icons**: Lucide Icons
- **Visualisasi & Export**: Chart.js, SheetJS (XLSX)

---

## ⚡ Cara Menjalankan Aplikasi

### Cara 1 (Paling Mudah di Windows):
Cukup klik ganda (double-click) file:
```
run.bat
```
Browser akan otomatis membuka `http://localhost:5000`.

### Cara 2 (Via Terminal / PowerShell):
1. Buka PowerShell atau Command Prompt.
2. Masuk ke direktori aplikasi:
   ```powershell
   cd C:\Users\Lenovo\.gemini\antigravity\scratch\daily-report-app
   ```
3. Install dependensi (hanya Flask):
   ```powershell
   python -m pip install -r requirements.txt
   ```
4. Jalankan aplikasi:
   ```powershell
   python app.py
   ```
5. Buka di browser: `http://localhost:5000`

---

## 📁 Struktur Direktori

```
daily-report-app/
├── app.py                  # Server Flask & SQLite API
├── daily_reports.db        # Database SQLite (dibuat otomatis)
├── requirements.txt        # Dependensi Python
├── run.bat                 # Script startup 1-klik untuk Windows
├── README.md               # Dokumentasi aplikasi
├── static/
│   ├── css/
│   │   └── style.css       # Style custom & print/PDF format
│   └── js/
│       └── app.js          # Logika frontend, charts, dan export
└── templates/
    └── index.html          # Halaman utama aplikasi (Single Page App)
```
