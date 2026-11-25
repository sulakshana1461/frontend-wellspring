import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminPortalLogic } from './adminLogic';
import IsoDateInput from './IsoDateInput';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './DoctorPortal.css'; 
import './AdminPortal.css';

export default function AdminPortal() {
  const [medFlowSearch, setMedFlowSearch] = useState('');
  const [expandAllMeds, setExpandAllMeds] = useState(false);

  const {
    loggedInAdmin, loginUsername, setLoginUsername, loginPassword, setLoginPassword, loginError, loggingIn, handleAdminLogin, handleAdminLogout,
    activeTab, setActiveTab, statusBanner,
    dateFilter, setDateFilter, customStart, setCustomStart, customEnd, setCustomEnd,
    financeSummary, financeChart, topMedicinesChart, weeklyTrafficChart, loadingFinance,
    demographics, loadingDemographics,
    logDate, setLogDate, dailyLogList, loadingLog, handleDownloadCSV,
    systemUsers, loadingUsers, newUserForm, setNewUserForm, registeringUser, handleRegisterUser, handleDeleteUser,
    verifyCodeInput, setVerifyCodeInput, verifyingCode, verifyResult, verifySearched, handleVerifyAuthCode, handleClearVerify
  } = useAdminPortalLogic();

  const sortedDispensedMedicines = useMemo(() => {
    const list = Array.isArray(topMedicinesChart) ? [...topMedicinesChart] : [];
    return list
      .filter(item => Number(item?.total_sold || 0) > 0)
      .sort((a, b) => Number(b.total_sold || 0) - Number(a.total_sold || 0));
  }, [topMedicinesChart]);

  const totalUnitsDispensed = useMemo(
    () => sortedDispensedMedicines.reduce((sum, item) => sum + Number(item.total_sold || 0), 0),
    [sortedDispensedMedicines]
  );

  const maxDispensedQty = sortedDispensedMedicines.length > 0 ? Number(sortedDispensedMedicines[0].total_sold || 1) : 1;

  const filteredDispensedMedicines = useMemo(() => {
    const q = medFlowSearch.trim().toLowerCase();
    return sortedDispensedMedicines
      .map((item, idx) => ({ ...item, rank: idx + 1 }))
      .filter(item => !q || String(item.name || '').toLowerCase().includes(q));
  }, [sortedDispensedMedicines, medFlowSearch]);

  if (!loggedInAdmin) {
    return (
      <div className="doctor-login-wrapper" style={{ background: '#020617' }}>
        <div className="login-card" style={{ background: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}>
          <div className="login-header">
            <div className="login-brand-script" style={{ color: '#2dd4bf' }}>Wellspring</div>
            <span className="login-badge" style={{ background: '#134e4a', color: '#5eead4' }}>Admin Command Center</span>
            <h1 style={{ color: '#f8fafc' }}>System Login</h1>
          </div>
          {loginError && <div className="login-error-msg">{loginError}</div>}
          <form onSubmit={handleAdminLogin}>
            <div className="login-form-group">
              <label style={{ color: '#94a3b8' }}>Admin Username</label>
              <input type="text" required className="login-input" style={{ background: '#020617', color: '#fff', borderColor: '#334155' }} value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} autoFocus />
            </div>
            <div className="login-form-group">
              <label style={{ color: '#94a3b8' }}>Password</label>
              <input type="password" required className="login-input" style={{ background: '#020617', color: '#fff', borderColor: '#334155' }} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loggingIn} className="login-submit-btn" style={{ background: '#0f766e' }}>
              {loggingIn ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
          <Link to="/" className="login-back-link" style={{ color: '#cbd5e1' }}>← Return to Home</Link>
        </div>
      </div>
    );
  }

  const FinanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', padding: '12px', borderRadius: '8px', color: '#fff' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 800, color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: '4px 0', color: '#38bdf8', fontWeight: 600 }}>Revenue: Rs. {payload[0].value.toFixed(2)}</p>
          <p style={{ margin: '4px 0', color: '#f87171', fontWeight: 600 }}>Medicine Cost: Rs. {payload[1].value.toFixed(2)}</p>
          <p style={{ margin: '4px 0', color: '#10b981', fontWeight: 800 }}>Net Profit: Rs. {payload[2].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-portal-wrapper">
      <header className="admin-topbar">
        <div className="admin-brand-group">
          <Link to="/" style={{ textDecoration: 'none' }}><span className="admin-logo-text">Wellspring</span></Link>
          <span className="admin-badge">Admin Analytics</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8' }}>Logged in as: <span style={{ color: '#fff' }}>{loggedInAdmin.name}</span></div>
          <button type="button" onClick={handleAdminLogout} className="doc-logout-btn" style={{ background: '#1e293b', borderColor: '#334155' }}>Secure Logout</button>
        </div>
      </header>

      {statusBanner && (
        <div className={`doc-toast-banner ${statusBanner.type}`} style={{ top: '80px' }}>{statusBanner.message}</div>
      )}

      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <button className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Financial Dashboard</button>
          <button className={`admin-nav-btn ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>👥 Patient Demographics</button>
          <button className={`admin-nav-btn ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>📄 Daily Spreadsheet Log</button>
          <button className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>⚙️ System Users</button>
          <button className={`admin-nav-btn ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>🔍 Verify Bill / Auth Code</button>
        </aside>

        <main className="admin-content-area">
          {/* TAB 1: FINANCIAL DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="admin-filter-bar">
                <div className="filter-btn-group">
                  <button className={`filter-tab ${dateFilter === 'TODAY' ? 'active' : ''}`} onClick={() => setDateFilter('TODAY')}>Today</button>
                  <button className={`filter-tab ${dateFilter === '7D' ? 'active' : ''}`} onClick={() => setDateFilter('7D')}>Last 7 Days</button>
                  <button className={`filter-tab ${dateFilter === '30D' ? 'active' : ''}`} onClick={() => setDateFilter('30D')}>Last 30 Days</button>
                  <button className={`filter-tab ${dateFilter === 'YTD' ? 'active' : ''}`} onClick={() => setDateFilter('YTD')}>Year to Date</button>
                  <button className={`filter-tab ${dateFilter === 'ALL' ? 'active' : ''}`} onClick={() => setDateFilter('ALL')}>All Time (2015-Now)</button>
                  <button className={`filter-tab ${dateFilter === 'CUSTOM' ? 'active' : ''}`} onClick={() => setDateFilter('CUSTOM')}>Custom Range</button>
                </div>
                {dateFilter === 'CUSTOM' && (
                  <div className="custom-date-inputs">
                    <IsoDateInput theme="dark" inline className="admin-date-input" value={customStart} onChange={val => setCustomStart(val)} />
                    <span style={{ color: '#64748b' }}>to</span>
                    <IsoDateInput theme="dark" inline className="admin-date-input" value={customEnd} onChange={val => setCustomEnd(val)} />
                  </div>
                )}
              </div>

              <div className="kpi-grid">
                <div className="kpi-card"><div className="kpi-title">Gross Revenue (Cash Collected)</div><div className="kpi-value">Rs. {financeSummary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                <div className="kpi-card"><div className="kpi-title">Raw Medicine Cost (Expenses)</div><div className="kpi-value" style={{ color: '#f87171' }}>Rs. {financeSummary.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                <div className="kpi-card profit"><div className="kpi-title">Net Clinic Profit</div><div className="kpi-value">Rs. {financeSummary.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                <div className="kpi-card"><div className="kpi-title">Dispensary Patients Served</div><div className="kpi-value" style={{ color: '#a78bfa' }}>{financeSummary.totalPatients.toLocaleString()}</div></div>
              </div>

              <div className="chart-card">
                <div className="chart-header">Revenue vs Profit Trajectory {loadingFinance && <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '10px' }}>Loading...</span>}</div>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={financeChart} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `Rs.${value/1000}k`} />
                    <Tooltip content={<FinanceTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="cost" name="Cost" stroke="#f87171" strokeWidth={2} fill="none" />
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="secondary-chart-card" style={{ marginTop: '24px' }}>
                <div className="chart-header">Clinic Busyness by Day of Week</div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={weeklyTrafficChart} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" />
                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="visits" name="Total Patient Visits" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="dispensed-flow-card">
                <div className="dispensed-flow-header">
                  <div>
                    <div className="chart-header" style={{ marginBottom: '4px' }}>
                      All Dispensed Medicines Flow (Most → Least)
                    </div>
                    <div className="dispensed-flow-meta">
                      <span>{sortedDispensedMedicines.length.toLocaleString()} Unique Medicines Dispensed</span>
                      <span>•</span>
                      <span>{totalUnitsDispensed.toLocaleString()} Total Units in Selected Period</span>
                    </div>
                  </div>
                  <div className="dispensed-flow-controls">
                    <input
                      type="text"
                      className="dispensed-flow-search"
                      placeholder="Filter medicine name..."
                      value={medFlowSearch}
                      onChange={(e) => setMedFlowSearch(e.target.value)}
                    />
                    {sortedDispensedMedicines.length > 14 && (
                      <button
                        type="button"
                        className="dispensed-flow-toggle-btn"
                        onClick={() => setExpandAllMeds(prev => !prev)}
                      >
                        {expandAllMeds ? 'Compact Scroll View' : `Expand All (${sortedDispensedMedicines.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {loadingFinance ? (
                  <div className="dispensed-flow-empty">Loading medicine flow data...</div>
                ) : filteredDispensedMedicines.length === 0 ? (
                  <div className="dispensed-flow-empty">
                    {medFlowSearch.trim()
                      ? `No dispensed medicine matches "${medFlowSearch.trim()}".`
                      : 'No medicines dispensed during the selected date range.'}
                  </div>
                ) : (
                  <div className={`dispensed-flow-list ${expandAllMeds ? 'expanded' : ''}`}>
                    {filteredDispensedMedicines.map((med) => {
                      const sold = Number(med.total_sold || 0);
                      const barPct = Math.max(2, (sold / maxDispensedQty) * 100);
                      const sharePct = totalUnitsDispensed > 0 ? ((sold / totalUnitsDispensed) * 100).toFixed(1) : '0.0';
                      const isTopThree = med.rank <= 3;

                      return (
                        <div key={`${med.rank}-${med.name}`} className="dispensed-flow-row">
                          <div className={`dispensed-flow-rank ${isTopThree ? 'top-rank' : ''}`}>
                            #{med.rank}
                          </div>
                          <div className="dispensed-flow-name" title={med.name}>
                            {med.name}
                          </div>
                          <div className="dispensed-flow-bar-track">
                            <div
                              className={`dispensed-flow-bar-fill ${isTopThree ? 'top-bar' : ''}`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <div className="dispensed-flow-stats">
                            <span className="dispensed-flow-qty">{sold.toLocaleString()}</span>
                            <span className="dispensed-flow-unit">units</span>
                            <span className="dispensed-flow-share">({sharePct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: PATIENT ANALYTICS */}
          {activeTab === 'patients' && (
            <div className="demographics-grid">
              <div className="chart-card">
                <div className="chart-header">Patient Age Demographics (Bell Curve) {loadingDemographics && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Loading...</span>}</div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={demographics.bellCurveData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="ageGroup" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" />
                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="patients" name="Total Patients" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-header">Gender Distribution</div>
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie data={demographics.genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {demographics.genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: '10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>■ Male</span> &nbsp;&nbsp; 
                  <span style={{ color: '#f472b6', fontWeight: 800 }}>■ Female</span> &nbsp;&nbsp;
                  <span style={{ color: '#64748b', fontWeight: 800 }}>■ Not Specified</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9' }}>
                  Total Master Records: {demographics.totalRegistered.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPREADSHEET LOG */}
          {activeTab === 'log' && (
            <div className="spreadsheet-card">
              <div className="spreadsheet-header-bar">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#5eead4' }}>Daily Business Log</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>View and export granular billing data as an Excel CSV</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <IsoDateInput theme="dark" inline className="admin-date-input" value={logDate} onChange={val => setLogDate(val)} required />
                  <button className="csv-btn" onClick={handleDownloadCSV}>📥 Export CSV (Excel)</button>
                </div>
              </div>
              <div className="spreadsheet-table-wrap">
                {loadingLog ? (
                  <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading ledger...</div>
                ) : dailyLogList.length === 0 ? (
                  <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>No transactions recorded on {logDate}.</div>
                ) : (
                  <table className="admin-sheet-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Bill #</th>
                        <th>Patient Name(s)</th>
                        <th>Phone</th>
                        <th>Doctor</th>
                        <th>Status</th>
                        <th>Med Cost (Rs)</th>
                        <th>Final Rev (Rs)</th>
                        <th style={{ color: '#10b981' }}>Profit (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLogList.map(row => {
                        const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(row.created_at));
                        const isOutdoor = row.bill_status === 'OUTDOOR_RX';
                        const revenue = isOutdoor ? 0 : (row.final_total || 0);
                        const cost = row.total_medicine_cost || 0;
                        const profit = revenue - cost;
                        return (
                          <tr key={row.id}>
                            <td style={{ color: '#94a3b8' }}>{time}</td>
                            <td style={{ fontWeight: 800 }}>#{row.daily_bill_no || row.id}</td>
                            <td>{row.patient_names || 'Walk-In'}</td>
                            <td>{row.patient_phone || '-'}</td>
                            <td>{row.doctor_name || '-'}</td>
                            <td>
                              <span className={`status-pill ${isOutdoor ? 'outdoor' : 'paid'}`}>
                                {isOutdoor ? 'Outdoor (No Meds)' : 'Paid Bill'}
                              </span>
                            </td>
                            <td style={{ color: '#f87171' }}>{cost.toFixed(2)}</td>
                            <td style={{ color: '#38bdf8' }}>{revenue.toFixed(2)}</td>
                            <td style={{ color: '#10b981', fontWeight: 800 }}>{profit.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM USERS */}
          {activeTab === 'users' && (
            <div className="users-grid">
              <div className="user-form-card">
                <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>+ Register New User</h3>
                <form onSubmit={handleRegisterUser}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Account Type</label>
                  <select className="user-form-select" value={newUserForm.role_type} onChange={e => setNewUserForm({ ...newUserForm, role_type: e.target.value })}>
                    <option value="DOCTOR">Doctor (Consultation Console)</option>
                    <option value="CASHIER">Cashier (Pharmacy & POS)</option>
                  </select>

                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Full Name</label>
                  <input type="text" required className="user-form-input" placeholder="e.g. Dr. Upul" value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} />

                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Username</label>
                  <input type="text" required className="user-form-input" placeholder="e.g. upul123" value={newUserForm.username} onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().trim() })} />

                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{newUserForm.role_type === 'DOCTOR' ? 'Specialty' : 'Role Title'}</label>
                  <input type="text" className="user-form-input" value={newUserForm.specialty_or_role} onChange={e => setNewUserForm({ ...newUserForm, specialty_or_role: e.target.value })} />

                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Secure Password</label>
                  <input type="password" required className="user-form-input" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} />

                  <button type="submit" disabled={registeringUser} className="csv-btn" style={{ width: '100%', marginTop: '10px' }}>
                    {registeringUser ? 'Registering...' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div className="user-list-card">
                <h3 style={{ margin: '0 0 6px 0', color: '#5eead4' }}>Active Staff Accounts</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Passwords are encrypted in the database (********). If a user forgets their password, remove them and register a new account.
                </p>
                {loadingUsers ? <p style={{ color: '#94a3b8' }}>Loading accounts...</p> : (
                  <div className="user-list-grid">
                    <div>
                      <h4 style={{ color: '#f472b6', borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '14px' }}>Doctors</h4>
                      {systemUsers.doctors.map(doc => (
                        <div key={doc.id} className="user-badge-card" style={{ marginBottom: '10px' }}>
                          <div>
                            <h4>{doc.name}</h4>
                            <p>User: <strong>{doc.username}</strong> | Pass: ********</p>
                          </div>
                          <button className="delete-user-btn" onClick={() => handleDeleteUser('DOCTOR', doc.id, doc.name)}>Remove</button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 style={{ color: '#38bdf8', borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '14px' }}>Cashiers</h4>
                      {systemUsers.cashiers.map(cash => (
                        <div key={cash.id} className="user-badge-card" style={{ marginBottom: '10px' }}>
                          <div>
                            <h4>{cash.name}</h4>
                            <p>User: <strong>{cash.username}</strong> | Pass: ********</p>
                          </div>
                          <button className="delete-user-btn" onClick={() => handleDeleteUser('CASHIER', cash.id, cash.name)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUTH CODE VERIFICATION ENGINE */}
          {activeTab === 'verify' && (
            <div className="verify-card">
              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#5eead4', fontWeight: 800 }}>
                  🔍 Receipt Authenticator &amp; Audit Engine
                </h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
                  Verify whether a patient&apos;s WhatsApp bill or receipt code genuinely exists in the clinic database and was paid into revenue.
                </p>
              </div>

              <form onSubmit={handleVerifyAuthCode} className="verify-search-box">
                <input
                  type="text"
                  className="verify-input"
                  placeholder="Enter Auth Code (e.g. WSP-7X8K or 7X8K)..."
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={verifyingCode}
                  className="verify-submit-btn"
                >
                  {verifyingCode ? 'Verifying...' : '⚡ Verify Code'}
                </button>
                {verifySearched && (
                  <button
                    type="button"
                    onClick={handleClearVerify}
                    className="verify-clear-btn"
                  >
                    Reset
                  </button>
                )}
              </form>

              {/* RESULT STATE 1: VERIFIED OFFICIAL TRANSACTION */}
              {verifyResult && verifyResult.verified && (
                <div className="verify-success-panel">
                  <div className="verify-success-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="verify-badge-pill">✅ OFFICIAL RECORDED BILL</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                        Auth Code: {verifyResult.bill.auth_code}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                      Database ID: #{verifyResult.bill.id}
                    </div>
                  </div>

                  <div className="verify-grid">
                    <div className="verify-kpi">
                      <div className="verify-kpi-label">Cash Collected</div>
                      <div className="verify-kpi-value" style={{ color: '#34d399' }}>
                        Rs. {Number(verifyResult.bill.final_total).toFixed(2)}
                      </div>
                    </div>

                    <div className="verify-kpi">
                      <div className="verify-kpi-label">Date &amp; Time</div>
                      <div className="verify-kpi-value" style={{ fontSize: '1.05rem', marginTop: '6px' }}>
                        {new Intl.DateTimeFormat('en-GB', {
                          timeZone: 'Asia/Colombo',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }).format(new Date(verifyResult.bill.created_at))}
                      </div>
                    </div>

                    <div className="verify-kpi">
                      <div className="verify-kpi-label">Billed By (Cashier)</div>
                      <div className="verify-kpi-value" style={{ color: '#38bdf8' }}>
                        {verifyResult.bill.created_by}
                      </div>
                    </div>

                    <div className="verify-kpi">
                      <div className="verify-kpi-label">Patient Name</div>
                      <div className="verify-kpi-value" style={{ fontSize: '1.1rem' }}>
                        {verifyResult.bill.patient_names}
                      </div>
                    </div>

                    <div className="verify-kpi">
                      <div className="verify-kpi-label">Patient Phone</div>
                      <div className="verify-kpi-value" style={{ fontSize: '1rem', color: '#94a3b8' }}>
                        {verifyResult.bill.patient_phone || 'None'}
                      </div>
                    </div>

                    <div className="verify-kpi">
                      <div className="verify-kpi-label">Consulting Doctor</div>
                      <div className="verify-kpi-value" style={{ fontSize: '1.1rem' }}>
                        {verifyResult.bill.doctor_name}
                      </div>
                    </div>
                  </div>

                  {/* Dispensed Items Snapshot */}
                  {Array.isArray(verifyResult.bill.items_snapshot) && verifyResult.bill.items_snapshot.length > 0 && (
                    <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(45, 212, 191, 0.2)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: '#5eead4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Dispensed Items &amp; Charges
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '6px 8px' }}>Type</th>
                            <th style={{ padding: '6px 8px' }}>Item Name</th>
                            <th style={{ padding: '6px 8px' }}>Qty</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Price</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verifyResult.bill.items_snapshot.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                              <td style={{ padding: '8px', color: '#94a3b8', fontSize: '0.78rem' }}>{item.item_type || 'ITEM'}</td>
                              <td style={{ padding: '8px', fontWeight: 700, color: '#f8fafc' }}>{item.name}</td>
                              <td style={{ padding: '8px' }}>{item.qty || 1}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>Rs. {Number(item.unit_price || 0).toFixed(2)}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                                Rs. {Number(item.line_total || (item.unit_price * (item.qty || 1)) || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* RESULT STATE 2: RECEIPT NOT FOUND */}
              {verifyResult && verifyResult.verified === false && (
                <div className="verify-failed-panel">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>❌</div>
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', color: '#fca5a5', fontSize: '1.25rem', fontWeight: 800 }}>
                        RECEIPT NOT FOUND IN CLINIC DATABASE
                      </h3>
                      <p style={{ margin: '0 0 10px 0', color: '#fecaca', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        No official transaction exists with Auth Code: <strong>{verifyResult.code || verifyCodeInput}</strong>.
                      </p>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>
                        ⚠️ <strong>Audit Warning:</strong> This payment was never entered into the dispensary POS. If a patient holds a WhatsApp message or paper receipt with this code, it was likely hand-typed without registering the cash into clinic revenue.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IDLE STATE: EXPLANATION */}
              {!verifySearched && (
                <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '0.95rem' }}>
                    🛡️ How Auth Code Anti-Fraud Verification Works:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Every official checkout in the counter portal generates a cryptographic <strong>Auth Code (e.g. WSP-7X8K)</strong> and stores it in the database.</li>
                    <li>Cashiers cannot invent a matching code because it is generated automatically upon database insertion.</li>
                    <li>Enter any code received on a patient&apos;s WhatsApp receipt above to instantly confirm whether the cash was entered into the clinic&apos;s revenue.</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}