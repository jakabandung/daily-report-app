// Daily Report Application JavaScript

let currentReports = [];
let deptChartInstance = null;
let trendChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // Initialize icons
    lucide.createIcons();

    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("reportDate");
    if (dateInput) dateInput.value = today;

    // Filter date defaults
    const filterDate = document.getElementById("filterDate");
    if (filterDate) filterDate.value = "";

    // Event listeners
    initEventListeners();

    // Load initial data
    loadDashboard();
    loadReports();
});

// Tab Switching
function switchTab(tabName) {
    const tabs = ["form", "dashboard", "archive"];
    tabs.forEach(t => {
        const content = document.getElementById(`tab-content-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            content.classList.remove("hidden");
            btn.classList.add("text-indigo-600", "border-indigo-600", "font-semibold");
            btn.classList.remove("text-slate-500", "border-transparent");
        } else {
            content.classList.add("hidden");
            btn.classList.remove("text-indigo-600", "border-indigo-600", "font-semibold");
            btn.classList.add("text-slate-500", "border-transparent");
        }
    });

    if (tabName === "dashboard") {
        loadDashboard();
    } else if (tabName === "archive") {
        loadReports();
    }

    lucide.createIcons();
}

// Event Listeners
function initEventListeners() {
    // Form blocker checkbox toggle
    const hasBlockersCheckbox = document.getElementById("hasBlockers");
    const blockerContainer = document.getElementById("blockerInputContainer");
    if (hasBlockersCheckbox && blockerContainer) {
        hasBlockersCheckbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                blockerContainer.classList.remove("hidden");
            } else {
                blockerContainer.classList.add("hidden");
            }
        });
    }

    // Form submit
    const reportForm = document.getElementById("reportForm");
    if (reportForm) {
        reportForm.addEventListener("submit", handleFormSubmit);
    }

    // Filter controls
    const searchInput = document.getElementById("filterSearch");
    const deptSelect = document.getElementById("filterDept");
    const blockerSelect = document.getElementById("filterBlocker");
    const dateFilter = document.getElementById("filterDate");

    if (searchInput) searchInput.addEventListener("input", debounce(loadReports, 300));
    if (deptSelect) deptSelect.addEventListener("change", loadReports);
    if (blockerSelect) blockerSelect.addEventListener("change", loadReports);
    if (dateFilter) dateFilter.addEventListener("change", loadReports);
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Load Dashboard Statistics & Charts
async function loadDashboard() {
    try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (!json.success) return;

        const data = json.data;

        // Metric cards
        document.getElementById("statTotalToday").textContent = data.today_reports || 0;
        document.getElementById("statTotalAll").textContent = data.total_reports || 0;
        document.getElementById("statBlockersToday").textContent = data.today_blockers || 0;
        document.getElementById("statEmployees").textContent = data.total_employees || 0;

        // Render charts
        renderDeptChart(data.department_stats || []);
        renderTrendChart(data.date_trends || []);

        // Load today's reports for quick feed
        loadTodayFeed();
    } catch (err) {
        console.error("Gagal memuat statistik dashboard:", err);
    }
}

// Render Department Doughnut Chart
function renderDeptChart(deptData) {
    const canvas = document.getElementById("chartDepartment");
    if (!canvas) return;

    if (deptChartInstance) {
        deptChartInstance.destroy();
    }

    const labels = deptData.map(d => d.department);
    const counts = deptData.map(d => d.count);
    const colors = [
        "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"
    ];

    deptChartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels.length > 0 ? labels : ["Belum ada data"],
            datasets: [{
                data: counts.length > 0 ? counts : [1],
                backgroundColor: counts.length > 0 ? colors.slice(0, labels.length) : ["#e2e8f0"],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 12, font: { size: 11, family: "Plus Jakarta Sans" } }
                }
            },
            cutout: "68%"
        }
    });
}

// Render Submission Trend Chart
function renderTrendChart(trendData) {
    const canvas = document.getElementById("chartTrend");
    if (!canvas) return;

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    const labels = trendData.map(d => {
        const parts = d.report_date.split("-");
        return `${parts[2]}/${parts[1]}`;
    });
    const counts = trendData.map(d => d.count);

    trendChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels.length > 0 ? labels : ["Hari ini"],
            datasets: [{
                label: "Jumlah Laporan",
                data: counts.length > 0 ? counts : [0],
                backgroundColor: "#6366f1",
                borderRadius: 6,
                maxBarThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0, font: { size: 11, family: "Plus Jakarta Sans" } },
                    grid: { color: "#f1f5f9" }
                },
                x: {
                    ticks: { font: { size: 11, family: "Plus Jakarta Sans" } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Load Today's Feed for Dashboard
async function loadTodayFeed() {
    const today = new Date().toISOString().split("T")[0];
    const feedContainer = document.getElementById("todayFeedList");
    if (!feedContainer) return;

    try {
        const res = await fetch(`/api/reports?date=${today}`);
        const json = await res.json();
        
        if (!json.success || json.data.length === 0) {
            feedContainer.innerHTML = `
                <div class="text-center py-8 text-slate-400">
                    <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                    <p class="text-sm">Belum ada laporan masuk hari ini.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        feedContainer.innerHTML = json.data.map(r => `
            <div class="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-200/80 flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        ${r.employee_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-slate-900 text-sm">${r.employee_name}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">${r.department}</span>
                            ${r.has_blockers ? '<span class="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> Ada Kendala</span>' : '<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Lancar</span>'}
                        </div>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-1">${r.completed_tasks.replace(/\n/g, " • ")}</p>
                    </div>
                </div>
                <button onclick="viewReportDetail(${r.id})" class="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition shrink-0">
                    Detail
                </button>
            </div>
        `).join("");

        lucide.createIcons();
    } catch (err) {
        console.error("Gagal memuat feed hari ini:", err);
    }
}

// Load Reports for Archive / Data Table
async function loadReports() {
    const tableBody = document.getElementById("reportsTableBody");
    const countBadge = document.getElementById("reportCountBadge");
    if (!tableBody) return;

    const dateVal = document.getElementById("filterDate")?.value || "";
    const deptVal = document.getElementById("filterDept")?.value || "";
    const blockerVal = document.getElementById("filterBlocker")?.value || "";
    const searchVal = document.getElementById("filterSearch")?.value || "";

    let url = `/api/reports?search=${encodeURIComponent(searchVal)}`;
    if (dateVal) url += `&date=${encodeURIComponent(dateVal)}`;
    if (deptVal) url += `&department=${encodeURIComponent(deptVal)}`;
    if (blockerVal !== "") url += `&has_blockers=${encodeURIComponent(blockerVal)}`;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-10 text-slate-400">
                <i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500"></i>
                <p class="text-sm">Memuat data laporan...</p>
            </td>
        </tr>
    `;
    lucide.createIcons();

    try {
        const res = await fetch(url);
        const json = await res.json();

        if (!json.success || json.data.length === 0) {
            currentReports = [];
            if (countBadge) countBadge.textContent = "0 Laporan";
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-12 text-slate-400">
                        <i data-lucide="file-question" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                        <p class="text-base font-medium text-slate-600">Tidak ada laporan ditemukan</p>
                        <p class="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter yang aktif.</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        currentReports = json.data;
        if (countBadge) countBadge.textContent = `${json.data.length} Laporan`;

        tableBody.innerHTML = json.data.map(r => `
            <tr class="hover:bg-slate-50/80 transition border-b border-slate-100 text-sm">
                <td class="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i>
                        ${formatDateID(r.report_date)}
                    </div>
                </td>
                <td class="py-3.5 px-4">
                    <div class="font-semibold text-slate-800">${r.employee_name}</div>
                    <div class="text-xs text-slate-400">${r.work_location} • ${r.start_time || '09:00'} - ${r.end_time || '18:00'}</div>
                </td>
                <td class="py-3.5 px-4">
                    <span class="inline-block px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
                        ${r.department}
                    </span>
                </td>
                <td class="py-3.5 px-4 max-w-xs">
                    <p class="text-xs text-slate-600 line-clamp-2">${r.completed_tasks.replace(/\n/g, " • ")}</p>
                </td>
                <td class="py-3.5 px-4 whitespace-nowrap">
                    ${r.has_blockers ? `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">
                            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-500"></i> Ada Kendala
                        </span>
                    ` : `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500"></i> Lancar
                        </span>
                    `}
                </td>
                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="viewReportDetail(${r.id})" title="Lihat Laporan Lengkap" class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="printSingleReport(${r.id})" title="Cetak / PDF" class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                            <i data-lucide="printer" class="w-4 h-4"></i>
                        </button>
                        <button onclick="confirmDeleteReport(${r.id})" title="Hapus Laporan" class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");

        lucide.createIcons();
    } catch (err) {
        console.error("Gagal memuat daftar laporan:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-6 text-rose-500 text-sm">
                    Gagal mengambil data dari server. Pastikan aplikasi berjalan.
                </td>
            </tr>
        `;
    }
}

// Handle Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("btnSubmitReport");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Menyimpan...`;
    lucide.createIcons();

    const payload = {
        report_date: document.getElementById("reportDate").value,
        employee_name: document.getElementById("employeeName").value,
        department: document.getElementById("department").value,
        work_location: document.getElementById("workLocation").value,
        start_time: document.getElementById("startTime").value,
        end_time: document.getElementById("endTime").value,
        completed_tasks: document.getElementById("completedTasks").value,
        in_progress_tasks: document.getElementById("inProgressTasks").value,
        has_blockers: document.getElementById("hasBlockers").checked,
        blockers: document.getElementById("blockersText").value,
        tomorrow_plan: document.getElementById("tomorrowPlan").value,
        mood: document.getElementById("moodSelect").value
    };

    try {
        const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
            showToast("Laporan harian berhasil dikirim dan tersimpan!", "success");
            
            // Reset form fields except date & employee name for convenience
            document.getElementById("completedTasks").value = "";
            document.getElementById("inProgressTasks").value = "";
            document.getElementById("tomorrowPlan").value = "";
            document.getElementById("hasBlockers").checked = false;
            document.getElementById("blockersText").value = "";
            document.getElementById("blockerInputContainer").classList.add("hidden");

            // Switch to archive to see the report
            switchTab("archive");
            loadDashboard();
            loadReports();
        } else {
            showToast(json.message || "Gagal menyimpan laporan", "error");
        }
    } catch (err) {
        console.error("Error submit:", err);
        showToast("Terjadi kesalahan jaringan", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        lucide.createIcons();
    }
}

// View Detailed Report in Modal
async function viewReportDetail(id) {
    try {
        const res = await fetch(`/api/reports/${id}`);
        const json = await res.json();
        if (!json.success) {
            showToast("Laporan tidak ditemukan", "error");
            return;
        }

        const r = json.data;
        const modal = document.getElementById("detailModal");
        const content = document.getElementById("detailModalContent");

        content.innerHTML = `
            <div id="printableReportCard" class="space-y-6">
                <!-- Header Laporan Resmi -->
                <div class="border-b border-slate-200 pb-4 flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-indigo-600"></span>
                            <span class="text-xs uppercase tracking-wider font-bold text-indigo-600">Daily Activity Report</span>
                        </div>
                        <h2 class="text-xl font-bold text-slate-900 mt-1">${r.employee_name}</h2>
                        <p class="text-sm text-slate-500">${r.department} • Status: ${r.work_location} (${r.start_time || '08:30'} - ${r.end_time || '17:30'})</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-slate-400 font-medium">Tanggal Laporan</div>
                        <div class="text-base font-bold text-slate-800">${formatDateID(r.report_date)}</div>
                        <div class="mt-1">
                            ${r.has_blockers ? `
                                <span class="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-semibold">Ada Kendala</span>
                            ` : `
                                <span class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-semibold">Lancar / No Blockers</span>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Pekerjaan Selesai -->
                <div class="space-y-2">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> Tugas Diselesaikan Hari Ini
                    </h3>
                    <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                        ${escapeHtml(r.completed_tasks)}
                    </div>
                </div>

                <!-- Pekerjaan In Progress -->
                ${r.in_progress_tasks ? `
                <div class="space-y-2">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i> Sedang Dikerjakan (In Progress)
                    </h3>
                    <div class="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                        ${escapeHtml(r.in_progress_tasks)}
                    </div>
                </div>
                ` : ''}

                <!-- Kendala / Blockers -->
                ${r.has_blockers ? `
                <div class="space-y-2">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                        <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-600"></i> Kendala & Hambatan (Butuh Bantuan)
                    </h3>
                    <div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 text-sm whitespace-pre-line leading-relaxed font-medium">
                        ${escapeHtml(r.blockers || 'Tidak ada keterangan kendala tambahan')}
                    </div>
                </div>
                ` : ''}

                <!-- Rencana Kerja Besok -->
                ${r.tomorrow_plan ? `
                <div class="space-y-2">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <i data-lucide="arrow-right-circle" class="w-4 h-4 text-indigo-600"></i> Rencana Prioritas Besok
                    </h3>
                    <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                        ${escapeHtml(r.tomorrow_plan)}
                    </div>
                </div>
                ` : ''}

                <!-- Mood & Catatan Tambahan -->
                <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>Kondisi/Mood Hari Ini: <span class="font-semibold text-slate-700">${r.mood || 'Baik'}</span></div>
                    <div>Dicatat pada: ${r.created_at || '-'}</div>
                </div>
            </div>
        `;

        // Store active report for printing
        window.activeModalReport = r;

        modal.classList.remove("hidden");
        lucide.createIcons();
    } catch (err) {
        console.error("Gagal membuka detail:", err);
    }
}

function closeDetailModal() {
    const modal = document.getElementById("detailModal");
    if (modal) modal.classList.add("hidden");
}

// Print / PDF Export for Single Report
function printSingleReport(id) {
    viewReportDetail(id).then(() => {
        setTimeout(() => {
            window.print();
        }, 300);
    });
}

// Print Current Modal Report
function printModalReport() {
    window.print();
}

// Delete Confirmation
async function confirmDeleteReport(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) return;

    try {
        const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
            showToast("Laporan berhasil dihapus", "success");
            loadReports();
            loadDashboard();
        } else {
            showToast(json.message || "Gagal menghapus", "error");
        }
    } catch (err) {
        showToast("Gagal terhubung ke server", "error");
    }
}

// Export Data to Excel (.xlsx) using SheetJS
function exportReportsToExcel() {
    if (!currentReports || currentReports.length === 0) {
        showToast("Tidak ada data laporan untuk diexport", "error");
        return;
    }

    const rows = currentReports.map((r, idx) => ({
        "No": idx + 1,
        "Tanggal": r.report_date,
        "Nama Karyawan": r.employee_name,
        "Divisi": r.department,
        "Lokasi": r.work_location,
        "Jam Mulai": r.start_time || "-",
        "Jam Selesai": r.end_time || "-",
        "Tugas Selesai": r.completed_tasks,
        "Sedang Dikerjakan": r.in_progress_tasks || "-",
        "Ada Kendala": r.has_blockers ? "YA" : "TIDAK",
        "Keterangan Kendala": r.blockers || "-",
        "Rencana Besok": r.tomorrow_plan || "-",
        "Mood / Kondisi": r.mood || "Baik"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto fit column widths
    const colWidths = [
        { wch: 5 },  // No
        { wch: 12 }, // Tanggal
        { wch: 22 }, // Nama
        { wch: 20 }, // Divisi
        { wch: 10 }, // Lokasi
        { wch: 10 }, // Jam Mulai
        { wch: 10 }, // Jam Selesai
        { wch: 40 }, // Tugas Selesai
        { wch: 30 }, // In Progress
        { wch: 12 }, // Kendala
        { wch: 35 }, // Keterangan
        { wch: 35 }, // Rencana Besok
        { wch: 15 }  // Mood
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Reports");

    const todayStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Rekap_Daily_Report_${todayStr}.xlsx`);
    showToast("Berhasil mendownload file Excel (.xlsx)!", "success");
}

// Trigger browser print for PDF table summary
function exportReportsToPDF() {
    window.print();
}

// Format Date ID (Contoh: 17 November 2026)
function formatDateID(dateString) {
    if (!dateString) return "-";
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const parts = dateString.split("-");
    if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1];
        const year = parts[0];
        return `${day} ${month} ${year}`;
    }
    return dateString;
}

// Escape HTML utility
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Toast Notification
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
        type === "success" 
            ? "bg-emerald-900/95 text-white border-emerald-700" 
            : "bg-rose-900/95 text-white border-rose-700"
    }`;

    const icon = type === "success" ? "check-circle" : "alert-circle";
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 shrink-0 ${type === 'success' ? 'text-emerald-400' : 'text-rose-400'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.replace("toast-enter", "toast-exit");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
