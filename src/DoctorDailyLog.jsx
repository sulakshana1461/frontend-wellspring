import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from './apiConfig';
import { calculateAge, formatClearDate } from './doctorLogic';
import './DoctorPortal.css';
import './AdminPortal.css';
import './DoctorDailyLog.css';

export default function DoctorDailyLog() {
  const navigate = useNavigate();

  // 1. Doctor Session Authentication Check
  const [doctorSession, setDoctorSession] = useState(() => {
    const saved = sessionStorage.getItem('wellspring_doctor_session') || localStorage.getItem('wellspring_doctor_session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed?.role === 'DOCTOR' ? parsed : null;
    } catch {
      return null;
    }
  });

  // 2. Active Theme
  const [activeTheme] = useState(() => localStorage.getItem('wellspring_doc_theme') || 'teal');

  // 3. Date Selection (Defaults to Today in Asia/Colombo)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
  });

  // 4. Data States
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState({
    summary: { totalPatients: 0, totalRevenue: 0, paidBillsCount: 0, outdoorCount: 0 },
    records: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 5. Fetch Daily Log from Backend
  const fetchDailyLog = useCallback(async () => {
    if (!doctorSession) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/doctor/daily-log`, {
        params: { date: selectedDate }
      });
      setDailyData(res.data);
    } catch (err) {
      console.error('Failed to load doctor daily log:', err);
      showToast(err.response?.data?.error || 'Failed to load daily log for selected date.', 'error');
    } finally {
      setLoading(false);
    }
  }, [doctorSession, selectedDate]);

  useEffect(() => {
    fetchDailyLog();
  }, [fetchDailyLog]);

  // Date Shifters
  const handleShiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(current);
    setSelectedDate(newDateStr);
  };

  const handleSetToday = () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
    setSelectedDate(today);
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (dailyData.records || []).filter((row) => {
      // Status filter
      if (statusFilter === 'PAID' && row.bill_status !== 'COMPLETED_BILL') return false;
      if (statusFilter === 'OUTDOOR' && row.bill_status !== 'OUTDOOR_RX') return false;
      if (statusFilter === 'WAITING' && row.bill_status !== 'WAITING' && row.bill_status !== 'AT_COUNTER') return false;

      // Text search
      if (!q) return true;
      const name = (row.patient_name || '').toLowerCase();
      const phone = (row.patient_phone || '').toLowerCase();
      const prescription = (row.prescription || '').toLowerCase();
      const ticketNum = String(row.ticket_number || '').toLowerCase();
      const remarks = (row.remarks || '').toLowerCase();

      return name.includes(q) || phone.includes(q) || prescription.includes(q) || ticketNum.includes(q) || remarks.includes(q);
    });
  }, [dailyData.records, searchQuery, statusFilter]);

  // CSV Export Logic
  const handleDownloadCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return showToast('No records available to export for this date.', 'error');
    }

    const headers = [
      '#',
      'Time',
      'Queue / Ticket #',
      'Patient Name',
      'Phone',
      'Gender',
      'Age / DOB',
      'Medicine Prescription (Doctor)',
      'Clinical Remarks / Diagnosis',
      'Status',
      'Revenue (Rs)'
    ];

    const rows = filteredRecords.map((row, idx) => {
      const timeStr = row.time
        ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(row.time))
        : '-';

      const genderStr = row.gender === 1 ? 'Male' : row.gender === 2 ? 'Female' : 'Not Set';
      const ageStr = row.birth_date ? calculateAge(row.birth_date) : '-';
      const statusStr = row.bill_status === 'COMPLETED_BILL' ? 'Paid Bill' : row.bill_status === 'OUTDOOR_RX' ? 'Outdoor Medicine' : row.bill_status || 'Pending';
      const cleanRx = (row.prescription || '').replace(/"/g, '""');
      const cleanRemarks = (row.remarks || '').replace(/"/g, '""');
      const cleanName = (row.patient_name || '').replace(/"/g, '""');

      return [
        idx + 1,
        timeStr,
        row.ticket_number || row.ticket_id || '-',
        `"${cleanName}"`,
        `"${row.patient_phone || ''}"`,
        genderStr,
        `"${ageStr}"`,
        `"${cleanRx}"`,
        `"${cleanRemarks}"`,
        statusStr,
        Number(row.revenue || 0).toFixed(2)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Wellspring_Doctor_Daily_Log_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${filteredRecords.length} records to Excel CSV.`);
  };

  // 6. Security Fallback: Only Doctor can enter
  if (!doctorSession) {
    return (
      <div className="doc-auth-gate-container">
        <div className="doc-auth-gate-card">
          <div className="doc-gate-brand">Wellspring</div>
          <div className="doc-gate-sub">Medical Center &amp; Dispensary</div>
          <div className="doc-gate-alert">
            <h3>🔒 Doctor Access Restricted</h3>
            <p>
              This daily clinical log is strictly restricted to consulting physicians.
              Please sign in to the Doctor Console to view this patient ledger.
            </p>
          </div>
          <Link to="/doctor" className="doc-gate-login-btn">
            Sign In to Doctor Console →
          </Link>
        </div>
      </div>
    );
  }

  const { summary } = dailyData;

  return (
    <div className={`doctor-portal-theme theme-${activeTheme} doc-daily-log-page`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`doc-toast-banner ${toastMessage.type === 'error' ? 'error' : 'success'}`}>
          {toastMessage.message}
        </div>
      )}

      {/* TOP HEADER BAR (MATCHING ADMIN & DOCTOR PORTAL) */}
      <header className="doc-top-bar">
        <div className="doc-header-left">
          <div className="doc-brand-title">Wellspring</div>
          <div className="doc-header-divider"></div>
          <div>
            <div className="doc-header-heading">Doctor's Daily Clinical Log</div>
            <div className="doc-header-sub">
              {doctorSession.name || 'Dr. Upul Jayathilaka'} • Daily Consultations &amp; Prescriptions Ledger
            </div>
          </div>
        </div>

        <div className="doc-header-right">
          <div className="log-date-picker-wrap">
            <button
              type="button"
              className="date-nav-arrow-btn"
              onClick={() => handleShiftDate(-1)}
              title="Previous Day"
            >
              ◀
            </button>
            <input
              type="date"
              className="admin-date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              type="button"
              className="date-nav-arrow-btn"
              onClick={() => handleShiftDate(1)}
              title="Next Day"
            >
              ▶
            </button>
            <button
              type="button"
              className="date-today-btn"
              onClick={handleSetToday}
            >
              Today
            </button>
          </div>

          <button
            type="button"
            className="csv-btn"
            onClick={handleDownloadCSV}
            title="Download CSV for Excel / Google Sheets"
          >
            📥 Export CSV
          </button>

          <Link to="/doctor" className="doc-logout-btn" style={{ textDecoration: 'none' }}>
            ← Back to Console
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="doc-log-main-container">
        {/* KPI SUMMARY CARDS (NO PROFIT, NO EXPENSES - TOTAL REVENUE & PATIENT COUNTS ONLY) */}
        <section className="doc-kpi-summary-grid">
          <div className="doc-kpi-card total-patients">
            <div className="doc-kpi-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="doc-kpi-title">Total Patients Seen</div>
              <div className="doc-kpi-value">{summary.totalPatients || 0}</div>
              <div className="doc-kpi-hint">Consultations on {formatClearDate(selectedDate)}</div>
            </div>
          </div>

          <div className="doc-kpi-card total-revenue">
            <div className="doc-kpi-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <div className="doc-kpi-title">Total Revenue</div>
              <div className="doc-kpi-value" style={{ color: '#38bdf8' }}>
                Rs. {Number(summary.totalRevenue || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="doc-kpi-hint">Total clinic billings for this date</div>
            </div>
          </div>

          <div className="doc-kpi-card paid-bills">
            <div className="doc-kpi-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="doc-kpi-title">Dispensary Paid Bills</div>
              <div className="doc-kpi-value" style={{ color: '#34d399' }}>{summary.paidBillsCount || 0}</div>
              <div className="doc-kpi-hint">Patients who collected medicines</div>
            </div>
          </div>

          <div className="doc-kpi-card outdoor-bills">
            <div className="doc-kpi-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <div>
              <div className="doc-kpi-title">Outdoor Prescriptions</div>
              <div className="doc-kpi-value" style={{ color: '#fbbf24' }}>{summary.outdoorCount || 0}</div>
              <div className="doc-kpi-hint">External pharmacy / no medicines billed</div>
            </div>
          </div>
        </section>

        {/* CLINICAL LEDGER SPREADSHEET CARD (EXACT ADMIN PANEL SPREADSHEET INTERFACE) */}
        <section className="spreadsheet-card doc-ledger-card">
          <div className="spreadsheet-header-bar">
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#5eead4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <span>Clinical Consultations &amp; Prescriptions Ledger</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Showing detailed patient consultations, medicine prescriptions written, and billing totals for {selectedDate}.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="doc-ledger-search-wrap">
                <input
                  type="text"
                  className="doc-ledger-search-input"
                  placeholder="Search patient, phone, prescription..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                className="doc-status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses ({dailyData.records.length})</option>
                <option value="PAID">Paid Bills Only</option>
                <option value="OUTDOOR">Outdoor Medicine Only</option>
                <option value="WAITING">Waiting / In Progress</option>
              </select>

              <button
                type="button"
                className="refresh-mini-btn"
                onClick={fetchDailyLog}
                title="Refresh Ledger"
              >
                {loading ? 'Loading...' : '↻ Refresh'}
              </button>
            </div>
          </div>

          <div className="spreadsheet-table-wrap">
            {loading ? (
              <div style={{ padding: '60px', color: '#94a3b8', textAlign: 'center', fontSize: '1.05rem' }}>
                <div className="doc-pulse-spinner"></div>
                <div style={{ marginTop: '14px' }}>Loading clinical ledger for {selectedDate}...</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ padding: '60px', color: '#94a3b8', textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📁</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' }}>
                  No consultations recorded on {selectedDate}.
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                  {searchQuery ? 'Try adjusting your search query or status filter.' : 'Choose another date from the calendar picker above.'}
                </div>
              </div>
            ) : (
              <table className="admin-sheet-table doc-daily-sheet-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '90px' }}>Time</th>
                    <th style={{ width: '90px' }}>Queue #</th>
                    <th>Patient Details</th>
                    <th style={{ width: '130px' }}>Phone</th>
                    <th style={{ width: '80px' }}>Gender</th>
                    <th style={{ width: '90px' }}>Age</th>
                    <th style={{ minWidth: '320px' }}>Medicine Prescription (Written by Doctor)</th>
                    <th>Clinical Notes / Reason</th>
                    <th style={{ width: '130px' }}>Billing Status</th>
                    <th style={{ width: '120px', textAlign: 'right', color: '#38bdf8' }}>Revenue (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((row, idx) => {
                    const timeStr = row.time
                      ? new Intl.DateTimeFormat('en-GB', {
                          timeZone: 'Asia/Colombo',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }).format(new Date(row.time))
                      : '-';

                    const isOutdoor = row.bill_status === 'OUTDOOR_RX';
                    const isPaid = row.bill_status === 'COMPLETED_BILL';
                    const isWaiting = row.bill_status === 'WAITING' || row.bill_status === 'AT_COUNTER';
                    const ageText = row.birth_date ? calculateAge(row.birth_date) : '-';

                    return (
                      <tr key={row.id || idx}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ color: '#94a3b8', fontWeight: 600 }}>{timeStr}</td>
                        <td style={{ fontWeight: 800, color: '#5eead4' }}>
                          #{row.ticket_number || row.ticket_id || '-'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.96rem' }}>
                            {row.patient_name || 'Walk-In Patient'}
                          </div>
                          {row.id_number && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                              NIC: {row.id_number}
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {row.patient_phone || <span style={{ color: '#64748b' }}>—</span>}
                        </td>
                        <td>
                          {row.gender === 1 ? (
                            <span className="gender-tag male">Male</span>
                          ) : row.gender === 2 ? (
                            <span className="gender-tag female">Female</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td style={{ color: '#94a3b8' }}>{ageText}</td>
                        <td>
                          {row.prescription ? (
                            <div className="doc-rx-prescription-cell">
                              {row.prescription}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>No prescription written</span>
                          )}
                        </td>
                        <td>
                          {row.remarks ? (
                            <div style={{ fontSize: '0.86rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                              {row.remarks}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${isPaid ? 'paid' : isOutdoor ? 'outdoor' : isWaiting ? 'waiting' : 'info'}`}>
                            {isPaid ? '✓ Paid Bill' : isOutdoor ? 'Outdoor (No Meds)' : isWaiting ? 'In Queue' : row.bill_status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: isPaid ? '#38bdf8' : '#64748b' }}>
                          {isPaid ? `Rs. ${Number(row.revenue || 0).toFixed(2)}` : 'Rs. 0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
