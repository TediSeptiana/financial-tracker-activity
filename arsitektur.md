# Dokumen Perancangan Teknis: PWA Tracker Keuangan & Catatan Kegiatan

## 1. Spesifikasi PWA & Lingkungan

- **Arsitektur:** Client-side web app berbasis HTML5, CSS3, dan Vanilla JavaScript (ES6+), tanpa _bundler_ atau _build step_ lokal.
- **Penyimpanan Data:** `localStorage` (`pwa_transactions_v1`, `pwa_activities_v1`, `pwa_preferences_v1`).
- **Offline & Instalasi:** `manifest.json` (`display: "standalone"`) + `Service Worker` (`sw.js`) dengan strategi _Cache-First_ untuk aset statis; dijalankan di `https://` atau `localhost` (akses perangkat mobile saat pengembangan melalui _tunnel_/LAN, lalu pemakaian harian lokal dari _cache_ + `localStorage`).
- **Dependensi CDN:**
- `Day.js`: normalisasi & pemformatan tanggal (`YYYY-MM`, `DD MMM YYYY`).
- `Chart.js`: render grafik pemasukan/pengeluaran dan distribusi kategori.
- `PapaParse` _(opsional)_: serialisasi/deserialisasi data CSV.

---

## 2. Struktur Direktori

```text
/
├── index.html
├── style.css
├── app.js
├── sw.js
├── manifest.json
└── icons/
    ├── icon-192.png
    └── icon-512.png

```

---

## 3. Flowchart Sistem

```text
[App Launch]
   │
   ▼
[SW Cache Check] ──(Cache Hit / Offline)──▶ [Load Static Assets]
   │ (Network / Cache Miss)
   ▼
[Fetch & Cache Assets] ──▶ [Parse HTML/CSS/JS]
                                 │
                                 ▼
                    [Read localStorage State]
                                 │
                                 ▼
               [Compute Aggregates & Render Views]
             (Summary Cards, Chart.js, Item Lists)
                                 │
                                 ▼
                         [Event Listener Loop]
      ┌──────────────────────────┼──────────────────────────┐
      ▼                          ▼                          ▼
[CRUD Mutation]            [Filter / Tab Event]       [Export CSV Event]
  │                          │                          │
  ▼                          ▼                          ▼
[Validate Schema]      [Update Filter State]      [Serialize Array]
  ├── Invalid ──▶ [Throw UI Error]                        │
  └── Valid ────▶ [Mutate Array]                          ▼
                     │                            [Trigger File Download]
                     ▼                                    │
             [Write localStorage]                         │
                     │                                    │
                     └─────────▶ [Re-render UI] ◀─────────┘

```

---

## 4. ERD / Model Data (`localStorage` JSON Schema)

```text
+-------------------------------------------------------+
|                      TRANSACTION                      |
+-------------------------------------------------------+
| PK | id        : string (UUID v4 / timestamp-rand)   |
|    | type      : 'income' | 'expense'                |
|    | amount    : number (finite, > 0)                |
|    | category  : string (non-empty)                  |
|    | date      : string (ISO date 'YYYY-MM-DD')        |
|    | note      : string | null                         |
|    | createdAt : string (ISO 8601 timestamp)           |
+-------------------------------------------------------+

+-------------------------------------------------------+
|                       ACTIVITY                        |
+-------------------------------------------------------+
| PK | id            : string (UUID v4 / timestamp-rand) |
|    | title         : string (non-empty)                |
|    | category      : string | null                     |
|    | scheduledDate : string (ISO date 'YYYY-MM-DD')      |
|    | isCompleted   : boolean (default: false)          |
|    | note          : string | null                   |
|    | createdAt     : string (ISO 8601 timestamp)       |
+-------------------------------------------------------+

+-------------------------------------------------------+
|                    APP_PREFERENCE                     |
+-------------------------------------------------------+
| PK | key           : string ('preferences')            |
|    | activeTab     : 'finance' | 'activity'            |
|    | monthFilter   : string ('YYYY-MM' | 'ALL')        |
|    | statusFilter  : 'ALL' | 'OPEN' | 'DONE'           |
+-------------------------------------------------------+

```

- **Kardinalitas:** Entitas berdiri sendiri sebagai _collection_ terpisah di `localStorage` (`1:N` implisit antara kunci _storage_ dan _item record_). Tidak ada relasi `USER` pada skema MVP.

---

## 5. Kontrak Modul & Alur Data (`app.js`)

1. **Storage Layer:** `loadState(key, fallback)` dan `saveState(key, data)` dengan `JSON.parse`/`JSON.stringify` dan _fallback_ aman jika data kosong/korup.
2. **Domain Logic:**

- `calcFinanceSummary(transactions)` → menghitung `totalIncome`, `totalExpense`, dan `balance` (`totalIncome - totalExpense`).
- `filterTransactions(transactions, monthFilter)` & `filterActivities(activities, statusFilter)`.

3. **Render Layer:**

- `renderSummary()`, `renderTransactionList()`, `renderActivityList()`, dan `updateChart(transactions)` (memanggil `.destroy()` atau mutasi `datasets` instance `Chart.js` agar tidak terjadi duplikasi _canvas_).

---

## 6. Tahapan Implementasi

1. **Core State & CRUD:** `index.html`, `style.css`, dan modul `localStorage` + form tambah/hapus transaksi & kegiatan.
2. **Charting & Date Handling:** Integrasi `Day.js` dan `Chart.js` via CDN.
3. **PWA Packaging:** Konfigurasi `manifest.json`, aset ikon, registrasi `sw.js`, dan _cache versioning_ (`CACHE_NAME`).
4. **Data Portability:** Penambahan fitur ekspor/impor JSON/CSV.
