import sqlite3
import os
import io
import csv
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, jsonify, Response

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "daily_reports.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        department TEXT NOT NULL,
        work_location TEXT DEFAULT 'WFO',
        start_time TEXT,
        end_time TEXT,
        completed_tasks TEXT NOT NULL,
        in_progress_tasks TEXT,
        has_blockers INTEGER DEFAULT 0,
        blockers TEXT,
        tomorrow_plan TEXT,
        mood TEXT DEFAULT 'Baik',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Seed initial demo data if table is empty
    cursor.execute("SELECT COUNT(*) FROM reports")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_demo_data(conn)
    conn.close()

def seed_demo_data(conn):
    cursor = conn.cursor()
    today_str = date.today().strftime("%Y-%m-%d")
    yesterday_str = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    sample_reports = [
        (
            today_str,
            "Budi Santoso",
            "IT & Engineering",
            "WFO",
            "08:30",
            "17:30",
            "- Menyelesaikan integrasi API pembayaran QRIS\n- Refactoring modul otentikasi JWT\n- Code review PR #142 dari tim frontend",
            "- Penyesuaian skema database untuk audit trail transaksi",
            0,
            "",
            "- Pengujian beban (load testing) endpoint pembayaran\n- Sync mingguan dengan Lead Architect",
            "Sangat Baik"
        ),
        (
            today_str,
            "Siti Rahma",
            "Marketing & Creative",
            "WFH",
            "09:00",
            "18:00",
            "- Rilis 3 konten infografis campaign Q4 di Instagram & LinkedIn\n- Menyusun brief video testimoni klien",
            "- Pembuatan storyboard video profil produk baru",
            1,
            "Aset aset foto produk dari tim desain grafis belum diserahkan sepenuhnya.",
            "- Revisi copy iklan Facebook Ads\n- Meeting koordinasi dengan tim Sales",
            "Butuh Dukungan"
        ),
        (
            today_str,
            "Dimas Pratama",
            "Operations & Support",
            "WFO",
            "08:00",
            "17:00",
            "- Menangani 18 tiket helpdesk prioritas tinggi\n- Maintenance rutin server database staging\n- Rekap log error sistem inventory",
            "- Pengecekan perangkat keras workstation divisi finance",
            0,
            "",
            "- Backup rutin data bulanan\n- Sosialisasi panduan keamanan akun ke seluruh staf",
            "Baik"
        ),
        (
            yesterday_str,
            "Anisa Lestari",
            "HR & General Affairs",
            "WFO",
            "08:30",
            "17:00",
            "- Wawancara 4 kandidat Senior Backend Engineer\n- Rekap absensi dan cuti karyawan periode bulan ini\n- Pengiriman onboarding package untuk 2 staf baru",
            "- Finalisasi materi orientasi karyawan baru",
            0,
            "",
            "- Penyusunan KPI semester depan\n- Koordinasi fasilitas kantor dengan vendor AC",
            "Sangat Baik"
        ),
        (
            yesterday_str,
            "Rian Hidayat",
            "Finance & Accounting",
            "WFO",
            "08:45",
            "17:45",
            "- Rekonsiliasi mutasi rekening bank minggu kedua\n- Pembayaran invoice vendor server dan hosting\n- Verifikasi reimburse klaim operasional tim lapangan",
            "- Penyusunan draft laporan cashflow kuartal",
            1,
            "Menunggu approval tanda tangan pimpinan untuk invoice vendor PT Mega Cloud.",
            "- Pengajuan pajak masa PPh 21\n- Rekonsiliasi petty cash kantor cabang",
            "Netral"
        )
    ]

    cursor.executemany("""
    INSERT INTO reports (
        report_date, employee_name, department, work_location, start_time, end_time,
        completed_tasks, in_progress_tasks, has_blockers, blockers, tomorrow_plan, mood
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_reports)
    conn.commit()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/reports", methods=["GET"])
def get_reports():
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    report_date = request.args.get("date")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    department = request.args.get("department")
    has_blockers = request.args.get("has_blockers")
    search = request.args.get("search")

    if report_date:
        query += " AND report_date = ?"
        params.append(report_date)
    else:
        if start_date:
            query += " AND report_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND report_date <= ?"
            params.append(end_date)

    if department and department != "Semua":
        query += " AND department = ?"
        params.append(department)

    if has_blockers is not None and has_blockers != "":
        query += " AND has_blockers = ?"
        params.append(int(has_blockers))

    if search:
        query += " AND (employee_name LIKE ? OR completed_tasks LIKE ? OR in_progress_tasks LIKE ? OR blockers LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard, wildcard])

    query += " ORDER BY report_date DESC, id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    reports = [dict(row) for row in rows]
    conn.close()
    return jsonify({"success": True, "data": reports, "count": len(reports)})

@app.route("/api/reports/<int:report_id>", methods=["GET"])
def get_report(report_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"success": False, "message": "Laporan tidak ditemukan"}), 404

    return jsonify({"success": True, "data": dict(row)})

@app.route("/api/reports", methods=["POST"])
def create_report():
    data = request.get_json() or {}

    report_date = data.get("report_date", "").strip() or date.today().strftime("%Y-%m-%d")
    employee_name = data.get("employee_name", "").strip()
    department = data.get("department", "").strip()
    work_location = data.get("work_location", "WFO")
    start_time = data.get("start_time", "").strip()
    end_time = data.get("end_time", "").strip()
    completed_tasks = data.get("completed_tasks", "").strip()
    in_progress_tasks = data.get("in_progress_tasks", "").strip()
    has_blockers = 1 if data.get("has_blockers") in (True, 1, "1", "true") else 0
    blockers = data.get("blockers", "").strip() if has_blockers else ""
    tomorrow_plan = data.get("tomorrow_plan", "").strip()
    mood = data.get("mood", "Baik")

    if not employee_name:
        return jsonify({"success": False, "message": "Nama karyawan wajib diisi."}), 400
    if not department:
        return jsonify({"success": False, "message": "Divisi/Departemen wajib dipilih."}), 400
    if not completed_tasks:
        return jsonify({"success": False, "message": "Daftar pekerjaan selesai wajib diisi."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO reports (
        report_date, employee_name, department, work_location, start_time, end_time,
        completed_tasks, in_progress_tasks, has_blockers, blockers, tomorrow_plan, mood
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_date, employee_name, department, work_location, start_time, end_time,
        completed_tasks, in_progress_tasks, has_blockers, blockers, tomorrow_plan, mood
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Laporan harian berhasil disimpan!", "id": new_id}), 201

@app.route("/api/reports/<int:report_id>", methods=["DELETE"])
def delete_report(report_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"success": False, "message": "Laporan tidak ditemukan"}), 404

    return jsonify({"success": True, "message": "Laporan berhasil dihapus."})

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    today_str = date.today().strftime("%Y-%m-%d")

    cursor.execute("SELECT COUNT(*) FROM reports")
    total_reports = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM reports WHERE report_date = ?", (today_str,))
    today_reports = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM reports WHERE report_date = ? AND has_blockers = 1", (today_str,))
    today_blockers = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT employee_name) FROM reports")
    total_employees = cursor.fetchone()[0]

    cursor.execute("""
    SELECT department, COUNT(*) as count 
    FROM reports 
    GROUP BY department 
    ORDER BY count DESC
    """)
    department_stats = [dict(row) for row in cursor.fetchall()]

    cursor.execute("""
    SELECT report_date, COUNT(*) as count 
    FROM reports 
    GROUP BY report_date 
    ORDER BY report_date DESC 
    LIMIT 7
    """)
    date_trends = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        "success": True,
        "data": {
            "total_reports": total_reports,
            "today_reports": today_reports,
            "today_blockers": today_blockers,
            "total_employees": total_employees,
            "department_stats": department_stats,
            "date_trends": list(reversed(date_trends))
        }
    })

@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    department = request.args.get("department")

    if start_date:
        query += " AND report_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND report_date <= ?"
        params.append(end_date)
    if department and department != "Semua":
        query += " AND department = ?"
        params.append(department)

    query += " ORDER BY report_date DESC, id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    # Generate CSV with UTF-8 BOM so Excel opens it with proper formatting
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "ID", "Tanggal", "Nama Karyawan", "Divisi", "Tipe Kerja",
        "Jam Mulai", "Jam Selesai", "Tugas Selesai", "Sedang Dikerjakan",
        "Ada Kendala", "Deskripsi Kendala", "Rencana Besok", "Kondisi/Mood", "Waktu Dibuat"
    ]
    writer.writerow(headers)

    for r in rows:
        writer.writerow([
            r["id"],
            r["report_date"],
            r["employee_name"],
            r["department"],
            r["work_location"],
            r["start_time"] or "-",
            r["end_time"] or "-",
            r["completed_tasks"].replace("\n", " | "),
            (r["in_progress_tasks"] or "").replace("\n", " | "),
            "Ya" if r["has_blockers"] == 1 else "Tidak",
            (r["blockers"] or "").replace("\n", " | "),
            (r["tomorrow_plan"] or "").replace("\n", " | "),
            r["mood"] or "Baik",
            r["created_at"]
        ])

    csv_data = "\ufeff" + output.getvalue()
    filename = f"rekap_daily_report_{date.today().strftime('%Y%m%d')}.csv"

    return Response(
        csv_data,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Pastikan database terinisialisasi saat aplikasi dijalankan (baik via python app.py maupun gunicorn)
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print(" Daily Report Application Server Running!")
    print(f" Akses aplikasi di browser: http://localhost:{port}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=True)
