import { useState } from 'react';
import { Link } from 'react-router-dom';
import './DoctorDailyLog.css';
import IsoDateInput from './IsoDateInput';
import {
  useDoctorPortalLogic,
  DOCTOR_THEMES,
  calculateDoctorAge,
  formatClearDate,
  getSriLankaTodayString,
  calculateBmiAndTargetWeight,
  calculateFraminghamCvd,
  INVESTIGATION_CONFIG,
  DEFAULT_INVESTIGATION_CATALOG
} from './doctorLogic';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import './DoctorPortal.css';

export default function DoctorPortal() {
  const {
    activeTheme,
    setActiveTheme,
    loggedInDoctor,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    loggingIn,
    handleDoctorLogin,
    handleDoctorLogout,
    sidebarTab,
    setSidebarTab,
    queueList,
    loadingQueue,
    fetchQueue,
    advancedSearch,
    setAdvancedSearch,
    searchResults,
    searchPage,
    hasMoreSearch,
    searching,
    handleSearchPatients,
    newPatientForm,
    setNewPatientForm,
    creatingPatient,
    handleCreateWalkInPatient,
    selectedPatient,
    activeTicketId,
    loadingProfile,
    selectPatientForConsultation,
    isEditingName, setIsEditingName, nameValue, setNameValue, savingName, handleSaveName,
    isEditingBirthDate, setIsEditingBirthDate, birthDateValue, setBirthDateValue, savingBirthDate, handleSaveBirthDate,
    isEditingMarital, setIsEditingMarital, maritalValue, setMaritalValue, savingMarital, handleSaveMaritalStatus,
    isEditingGender, setIsEditingGender, genderValue, setGenderValue, savingGender, handleSaveGender,
    isEditingPhone, setIsEditingPhone, phoneValue, setPhoneValue, savingPhone, handleSavePhone,
    commonText,
    setCommonText,
    isEditingCommon,
    setIsEditingCommon,
    savingCommon,
    handleSaveCommonDetails,
    allergiesText,
    setAllergiesText,
    isEditingAllergies,
    setIsEditingAllergies,
    savingAllergies,
    handleSaveAllergiesReports,
    prescriptionText,
    setPrescriptionText,
    remarksText,
    setRemarksText,
    submittingRx,
    handleSubmitPrescription,
    prescriptionHistory,
    bellCooldown,
    handleRingCounterBell,
    statusBanner,

    // Diagnostic Hub Analytics
    docDiagnosticTab, setDocDiagnosticTab,
    patientVitalsList, loadingVitals, vitalsForm, setVitalsForm, editingVitalId, savingVitals,
    handleSaveVitals, handleEditVital, handleCancelEditVital, handleDeleteVital,
    latestBmiMetrics, vitalsChartData,
    investigationCatalog, selectedCatalogTest, setSelectedCatalogTest,
    patientLabList, loadingLabs, labForm, setLabForm, editingLabId, savingLab,
    selectedLabMetricToGraph, setSelectedLabMetricToGraph,
    handleSelectTest, handleLabResultChange, handleSaveLabResult, handleEditLabResult, handleCancelEditLab, handleDeleteLabResult,
    filteredLabRecordsForGraph,
    cvdAge, setCvdAge, cvdGender, setCvdGender, cvdTotalChol, setCvdTotalChol, cvdHDL, setCvdHDL,
    cvdSBP, setCvdSBP, cvdIsTreated, setCvdIsTreated, cvdIsSmoker, setCvdIsSmoker, cvdIsDiabetic, setCvdIsDiabetic,
    cvdResult, handleAutoFillFramingham
  } = useDoctorPortalLogic();

  const selectedConfig = INVESTIGATION_CONFIG[selectedCatalogTest] || 
    (selectedCatalogTest?.toLowerCase().includes('thirox') || selectedCatalogTest?.toLowerCase().includes('thyrox') ? INVESTIGATION_CONFIG['Thyroxine'] : null) || 
    INVESTIGATION_CONFIG['Others'];
  const [isDiagnosticHubMinimized, setIsDiagnosticHubMinimized] = useState(false);

  const framinghamBarData = [
    {
      name: 'Current Patient',
      risk: cvdResult?.percentage || 0,
      fill: cvdResult?.color || '#f59e0b'
    },
    {
      name: 'Optimal Target',
      risk: calculateFraminghamCvd({
        age: cvdAge,
        gender: cvdGender,
        totalChol: 160,
        hdl: 55,
        sbp: 115,
        isTreated: false,
        isSmoker: false,
        isDiabetic: false
      }).percentage || 2.5,
      fill: '#10b981'
    }
  ];

  if (!loggedInDoctor) {
    return (
      <div className="doctor-login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="login-brand-script">Wellspring</div>
            <span className="login-badge">Doctor Console</span>
            <h1>Physician Sign In</h1>
            <p>Enter your clinical credentials to access patient consultations</p>
          </div>
          {loginError && <div className="login-error-msg">{loginError}</div>}
          <form onSubmit={handleDoctorLogin}>
            <div className="login-form-group">
              <label>Username</label>
              <input
                type="text"
                required
                className="login-input"
                placeholder="Enter username (e.g., upul)"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="login-form-group">
              <label>Password</label>
              <input
                type="password"
                required
                className="login-input"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loggingIn} className="login-submit-btn">
              {loggingIn ? 'Signing In...' : 'Sign In to Console'}
            </button>
          </form>
          <Link to="/" className="login-back-link">
            ← Return to Wellspring Main Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`doctor-portal-wrapper theme-${activeTheme}`}>
      <header className="doc-topbar">
        <div className="doc-topbar-left">
          <Link to="/" className="doc-back-btn">← Home</Link>
          <div className="topbar-divider"></div>
          <div className="doc-identity-info">
            <h1 className="doc-name-heading">{loggedInDoctor.name}</h1>
            <span className="doc-specialty-tag">{loggedInDoctor.specialty}</span>
          </div>
        </div>

        <div className="doc-topbar-right">
          <div className="theme-picker-group">
            <span className="theme-picker-label">Theme</span>
            {DOCTOR_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-swatch-btn ${activeTheme === t.id ? 'active' : ''}`}
                style={{ backgroundColor: t.swatch }}
                onClick={() => setActiveTheme(t.id)}
                title={t.name}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleRingCounterBell}
            className={`bell-trigger-btn ${bellCooldown ? 'on-cooldown' : ''}`}
            disabled={bellCooldown}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>{bellCooldown ? 'Waiting...' : 'Ring Counter'}</span>
          </button>

          <Link
            to="/doctor/daily-log"
            target="_blank"
            rel="noopener noreferrer"
            className="doc-nav-tab-btn"
            title="Open Doctor's Daily Clinical Log in a new tab"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Daily Log ↗</span>
          </Link>

          <button type="button" onClick={handleDoctorLogout} className="doc-logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      {statusBanner && (
        <div className={`doc-toast-banner ${statusBanner.type}`}>
          {statusBanner.message}
        </div>
      )}

      <div className="doc-workspace-grid">
        <aside className="doc-sidebar-card">
          <div className="sidebar-brand-banner">
            <div className="sidebar-banner-photo"></div>
            <div className="sidebar-banner-tint"></div>
            <div className="sidebar-banner-content">
              <span className="doctor-console-pill">Doctor Console</span>
              <div className="sidebar-wellspring-script">Wellspring</div>
            </div>
          </div>

          <div className="sidebar-separate-tabs">
            <button
              type="button"
              className={`sidebar-pill-btn ${sidebarTab === 'queue' ? 'active' : ''}`}
              onClick={() => setSidebarTab('queue')}
            >
              Queue ({queueList.length})
            </button>
            <button
              type="button"
              className={`sidebar-pill-btn ${sidebarTab === 'search' ? 'active' : ''}`}
              onClick={() => setSidebarTab('search')}
            >
              Find Patient
            </button>
            <button
              type="button"
              className={`sidebar-pill-btn ${sidebarTab === 'add' ? 'active' : ''}`}
              onClick={() => setSidebarTab('add')}
            >
              + New Patient
            </button>
          </div>

          <div className="sidebar-body">
            {sidebarTab === 'queue' && (
              <div>
                <div className="queue-header-row">
                  <span className="queue-count-pill">{queueList.length} in Queue</span>
                  <button type="button" onClick={fetchQueue} className="refresh-mini-btn">
                    {loadingQueue ? 'Loading...' : '↻ Refresh'}
                  </button>
                </div>

                {queueList.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '36px 14px', fontSize: '0.92rem', lineHeight: '1.6', fontWeight: 500 }}>
                    No patients waiting in the active queue. Use <strong>Find Patient</strong> or <strong>+ New Patient</strong> for direct walk-in consultations.
                  </p>
                ) : (
                  queueList.map((item, index) => (
                    <button
                      key={item.ticket_id}
                      type="button"
                      onClick={() => selectPatientForConsultation(item.patient, item.ticket_id)}
                      className={`patient-list-item ${
                        selectedPatient?.id === item.patient.id ? 'selected' : ''
                      }`}
                    >
                      <div className="patient-item-info">
                        <div className="patient-item-name">{item.patient.name}</div>
                        <div className="patient-item-sub">
                          {calculateDoctorAge(item.patient.birth_date)} • {item.patient.phone || 'No Phone'}
                        </div>
                      </div>
                      <span className="queue-order-badge" title="Arrival Queue Order">
                        Queue #{index + 1}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {sidebarTab === 'search' && (
              <div>
                <div className="advanced-search-grid">
                  <div className="walkin-form-group full-width">
                    <label className="walkin-label">Patient Name</label>
                    <input
                      type="text"
                      className="sidebar-search-input"
                      style={{ marginBottom: 0 }}
                      placeholder="e.g., Priyantha"
                      value={advancedSearch.name}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="walkin-form-group">
                    <label className="walkin-label">NIC Number</label>
                    <input
                      type="text"
                      className="sidebar-search-input"
                      style={{ marginBottom: 0 }}
                      placeholder="ID Number"
                      value={advancedSearch.nic}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, nic: e.target.value })}
                    />
                  </div>
                  
                  <div className="walkin-form-group">
                    <label className="walkin-label">Phone</label>
                    <input
                      type="text"
                      className="sidebar-search-input"
                      style={{ marginBottom: 0 }}
                      placeholder="07X..."
                      value={advancedSearch.phone}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, phone: e.target.value })}
                    />
                  </div>

                  <div className="walkin-form-group full-width">
                    <label className="walkin-label">Date of Birth (Year or Exact Date)</label>
                    <input
                      type="text"
                      className="sidebar-search-input"
                      style={{ marginBottom: 0 }}
                      placeholder="e.g., 2005 or 1993-05-14"
                      value={advancedSearch.dob}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, dob: e.target.value })}
                    />
                  </div>
                </div>

                {searching && (
                  <p style={{ color: '#475569', fontSize: '0.88rem', fontWeight: 600, marginBottom: '10px' }}>
                    Filtering patient database...
                  </p>
                )}

                {searchResults.map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => selectPatientForConsultation(pat, null)}
                    className={`patient-list-item ${
                      selectedPatient?.id === pat.id ? 'selected' : ''
                    }`}
                  >
                    <div className="patient-item-info">
                      <div className="patient-item-name">{pat.name}</div>
                      <div className="patient-item-sub">
                        DOB: {formatClearDate(pat.birth_date)} ({calculateDoctorAge(pat.birth_date)})
                      </div>
                      <div className="patient-item-sub">
                        Tel: {pat.phone || 'N/A'} {pat.id_number ? `• NIC: ${pat.id_number}` : ''}
                      </div>
                    </div>
                  </button>
                ))}

                {hasMoreSearch && (
                  <button
                    type="button"
                    onClick={() => handleSearchPatients(searchPage + 1)}
                    className="walkin-submit-btn"
                    style={{ marginTop: '8px' }}
                  >
                    Load More Results
                  </button>
                )}
              </div>
            )}

            {sidebarTab === 'add' && (
              <form onSubmit={handleCreateWalkInPatient}>
                <div className="walkin-form-grid">
                  <div className="walkin-form-group full-width">
                    <label className="walkin-label">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      placeholder="Enter full name"
                      value={newPatientForm.name}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                    />
                  </div>

                  <div className="walkin-form-group">
                    <label className="walkin-label">Gender *</label>
                    <div className="walkin-radio-wrap">
                      <label className="walkin-radio-label">
                        <input
                          type="radio"
                          name="gender"
                          value="1"
                          checked={newPatientForm.gender === '1'}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                        /> Male
                      </label>
                      <label className="walkin-radio-label">
                        <input
                          type="radio"
                          name="gender"
                          value="0"
                          checked={newPatientForm.gender === '0'}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                        /> Female
                      </label>
                    </div>
                  </div>

                  <div className="walkin-form-group">
                    <label className="walkin-label">Date of Birth (YYYY-MM-DD)</label>
                    <IsoDateInput
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      value={newPatientForm.birth_date}
                      onChange={(val) => setNewPatientForm({ ...newPatientForm, birth_date: val })}
                      maxDate={getSriLankaTodayString()}
                      showPreview
                      showAge
                    />
                  </div>

                  <div className="walkin-form-group">
                    <label className="walkin-label">Phone Number</label>
                    <input
                      type="text"
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      placeholder="07X XXX XXXX"
                      value={newPatientForm.phone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="walkin-form-group">
                    <label className="walkin-label">NIC / ID Number</label>
                    <input
                      type="text"
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      placeholder="NIC number"
                      value={newPatientForm.id_number}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, id_number: e.target.value })}
                    />
                  </div>

                  <div className="walkin-form-group">
                    <label className="walkin-label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      placeholder="e.g., 65.5"
                      value={newPatientForm.weight}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, weight: e.target.value })}
                    />
                  </div>

                  <div className="walkin-form-group">
                    <label className="walkin-label">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      placeholder="e.g., 170"
                      value={newPatientForm.height}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, height: e.target.value })}
                    />
                  </div>

                  <div className="walkin-form-group full-width">
                    <label className="walkin-label">Married?</label>
                    <div className="walkin-radio-wrap" style={{ gap: '24px' }}>
                      <label className="walkin-radio-label">
                        <input
                          type="radio"
                          name="married"
                          value="0"
                          checked={newPatientForm.married === '0'}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, married: e.target.value })}
                        /> No / Single
                      </label>
                      <label className="walkin-radio-label">
                        <input
                          type="radio"
                          name="married"
                          value="1"
                          checked={newPatientForm.married === '1'}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, married: e.target.value })}
                        /> Yes / Married
                      </label>
                    </div>
                  </div>

                  <div className="walkin-form-group full-width">
                    <label className="walkin-label">Common Details / Medical Notes</label>
                    <input
                      type="text"
                      className="walkin-input"
                      style={{ marginBottom: 0 }}
                      placeholder="Initial medical notes..."
                      value={newPatientForm.common}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, common: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" disabled={creatingPatient} className="walkin-submit-btn">
                  {creatingPatient ? 'Saving...' : 'Save & Open Patient'}
                </button>
              </form>
            )}
          </div>
        </aside>

        <main className="doc-middle-card">
          <div className="section-card-header">
            <div className="profile-header-left">
              <h2 className="section-card-title">Patient Clinical Profile</h2>
              <span className="section-card-tag">Medical Record</span>
            </div>
            <button
              type="button"
              className="jump-to-log-btn"
              onClick={() => {
                const el = document.getElementById('doc-history-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Jump directly to Consultation & Prescription Log"
            >
              📜 Log &darr;
            </button>
          </div>

          {!selectedPatient ? (
            <div className="empty-patient-state">
              <h2>No Patient Selected</h2>
              <p>
                Choose a patient from the <strong>Queue</strong> on the left, or use <strong>Find Patient</strong> to view any patient record.
              </p>
            </div>
          ) : loadingProfile ? (
            <div className="empty-patient-state">
              <p>Loading patient clinical profile...</p>
            </div>
          ) : (
            <div className="stacked-details-list">
              {/* PATIENT NAME (EDITABLE) */}
              <div className="stacked-field-block">
                <div className="editable-header-row">
                  <span className="stacked-field-label">
                    Patient Name {activeTicketId ? `• Ticket #${activeTicketId}` : '• Direct Walk-In'}
                  </span>

                  {!isEditingName ? (
                    <button
                      type="button"
                      className="edit-toggle-btn"
                      onClick={() => {
                        setNameValue(selectedPatient.name || '');
                        setIsEditingName(true);
                      }}
                      title="Edit patient name"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={savingName}
                      className="edit-toggle-btn done-mode"
                      onClick={handleSaveName}
                    >
                      {savingName ? 'Saving...' : 'Done'}
                    </button>
                  )}
                </div>

                {!isEditingName ? (
                  <div className="stacked-field-value-primary">
                    {selectedPatient.name}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="clinical-edit-input"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    placeholder="Enter corrected patient name"
                    autoFocus
                  />
                )}
                <div className="stacked-field-meta">
                  Patient ID: #{selectedPatient.id} {selectedPatient.phone ? `• Phone: ${selectedPatient.phone}` : ''}
                  {selectedPatient.id_number ? ` • NIC: ${selectedPatient.id_number}` : ''}
                </div>
              </div>

              {/* DATE OF BIRTH (EDITABLE) */}
              <div className="stacked-field-block">
                <div className="editable-header-row">
                  <span className="stacked-field-label">Date of Birth</span>

                  {!isEditingBirthDate ? (
                    <button
                      type="button"
                      className="edit-toggle-btn"
                      onClick={() => {
                        setBirthDateValue(selectedPatient.birth_date ? selectedPatient.birth_date.substring(0, 10) : '');
                        setIsEditingBirthDate(true);
                      }}
                      title="Edit date of birth"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={savingBirthDate}
                      className="edit-toggle-btn done-mode"
                      onClick={handleSaveBirthDate}
                    >
                      {savingBirthDate ? 'Saving...' : 'Done'}
                    </button>
                  )}
                </div>

                {!isEditingBirthDate ? (
                  <div className="stacked-field-value" style={{ marginTop: '4px' }}>
                    {formatClearDate(selectedPatient.birth_date)}
                  </div>
                ) : (
                  <IsoDateInput
                    className="clinical-edit-input"
                    value={birthDateValue}
                    onChange={(val) => setBirthDateValue(val)}
                    maxDate={getSriLankaTodayString()}
                    showPreview
                    showAge
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveBirthDate();
                      }
                      if (e.key === 'Escape') setIsEditingBirthDate(false);
                    }}
                    autoFocus
                  />
                )}
              </div>

              {/* AGE (DYNAMICALLY CALCULATED) */}
              <div className="stacked-field-block">
                <span className="stacked-field-label">Age</span>
                <div className="stacked-field-value">
                  {calculateDoctorAge(selectedPatient.birth_date)}
                </div>
              </div>

              {/* PHONE NUMBER (EDITABLE) */}
              <div className="stacked-field-block">
                <div className="editable-header-row">
                  <span className="stacked-field-label">Phone Number</span>

                  {!isEditingPhone ? (
                    <button
                      type="button"
                      className="edit-toggle-btn"
                      onClick={() => {
                        setPhoneValue(selectedPatient.phone || '');
                        setIsEditingPhone(true);
                      }}
                      title="Edit phone number"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={savingPhone}
                      className="edit-toggle-btn done-mode"
                      onClick={handleSavePhone}
                    >
                      {savingPhone ? 'Saving...' : 'Done'}
                    </button>
                  )}
                </div>

                {!isEditingPhone ? (
                  <div className="stacked-field-value" style={{ marginTop: '4px' }}>
                    {selectedPatient.phone ? (
                      <a href={`tel:${selectedPatient.phone}`} style={{ color: 'inherit', textDecoration: 'none' }} title="Call patient">
                        {selectedPatient.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500, fontSize: '0.92rem' }}>
                        No Phone Registered
                      </span>
                    )}
                  </div>
                ) : (
                  <input
                    type="tel"
                    className="clinical-edit-input"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePhone();
                      if (e.key === 'Escape') setIsEditingPhone(false);
                    }}
                    placeholder="e.g. 0714347804"
                    autoFocus
                  />
                )}
              </div>

              <div className="split-field-row">
                
                {/* GENDER (EDITABLE) */}
                <div className="stacked-field-block">
                  <div className="editable-header-row">
                    <span className="stacked-field-label">Gender</span>

                    {!isEditingGender ? (
                      <button
                        type="button"
                        className="edit-toggle-btn"
                        onClick={() => setIsEditingGender(true)}
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={savingGender}
                        className="edit-toggle-btn done-mode"
                        onClick={handleSaveGender}
                      >
                        {savingGender ? 'Saving...' : 'Done'}
                      </button>
                    )}
                  </div>

                  {!isEditingGender ? (
                    <div className="stacked-field-value" style={{ marginTop: '4px' }}>
                      {selectedPatient.gender === 1 ? 'Male' : selectedPatient.gender === 0 ? 'Female' : 'Not Specified'}
                    </div>
                  ) : (
                    <select
                      className="clinical-edit-select"
                      value={genderValue}
                      onChange={(e) => setGenderValue(e.target.value)}
                      autoFocus
                    >
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  )}
                </div>

                {/* MARITAL STATUS (EDITABLE) */}
                <div className="stacked-field-block">
                  <div className="editable-header-row">
                    <span className="stacked-field-label">Marital Status</span>

                    {!isEditingMarital ? (
                      <button
                        type="button"
                        className="edit-toggle-btn"
                        onClick={() => setIsEditingMarital(true)}
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={savingMarital}
                        className="edit-toggle-btn done-mode"
                        onClick={handleSaveMaritalStatus}
                      >
                        {savingMarital ? 'Saving...' : 'Done'}
                      </button>
                    )}
                  </div>

                  {!isEditingMarital ? (
                    <div className="stacked-field-value" style={{ marginTop: '4px' }}>
                      {selectedPatient.married === 1 ? 'Married' : 'Single / Unmarried'}
                    </div>
                  ) : (
                    <select
                      className="clinical-edit-select"
                      value={maritalValue}
                      onChange={(e) => setMaritalValue(e.target.value)}
                      autoFocus
                    >
                      <option value="0">Single / Unmarried</option>
                      <option value="1">Married</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="stacked-field-block">
                <div className="editable-header-row">
                  <span className="stacked-field-label">Common Details About Patient</span>

                  {!isEditingCommon ? (
                    <button
                      type="button"
                      className="edit-toggle-btn"
                      onClick={() => setIsEditingCommon(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={savingCommon}
                      className="edit-toggle-btn done-mode"
                      onClick={handleSaveCommonDetails}
                    >
                      {savingCommon ? 'Saving...' : 'Done'}
                    </button>
                  )}
                </div>

                {!isEditingCommon ? (
                  <div className="clinical-display-box">
                    {commonText ? (
                      commonText
                    ) : (
                      <span className="clinical-placeholder">No common details recorded. Click Edit to add.</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="clinical-edit-textarea"
                    value={commonText}
                    onChange={(e) => setCommonText(e.target.value)}
                    placeholder="Enter general patient details or long-term history..."
                    autoFocus
                  />
                )}
              </div>

              <div className="stacked-field-block">
                <div className="editable-header-row">
                  <span className="stacked-field-label">Allergies and Reports</span>

                  {!isEditingAllergies ? (
                    <button
                      type="button"
                      className="edit-toggle-btn"
                      onClick={() => setIsEditingAllergies(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={savingAllergies}
                      className="edit-toggle-btn done-mode"
                      onClick={handleSaveAllergiesReports}
                    >
                      {savingAllergies ? 'Saving...' : 'Done'}
                    </button>
                  )}
                </div>

                {!isEditingAllergies ? (
                  <div className="clinical-display-box">
                    {allergiesText ? (
                      allergiesText
                    ) : (
                      <span className="clinical-placeholder">No allergies or lab report findings recorded. Click Edit to add.</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="clinical-edit-textarea"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    placeholder="Enter drug allergies, lab investigation results, and clinical findings..."
                    autoFocus
                  />
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="doc-counter-handoff-card">
          <div className="to-counter-header">
            <h2 className="to-counter-title">To Counter</h2>
            <span className="live-handoff-tag">Dispensary Dispatch</span>
          </div>

          <form onSubmit={handleSubmitPrescription}>
            <div className="counter-form-group">
              <label className="counter-form-label">
                Prescription
              </label>
              <textarea
                className="rx-shorthand-textarea"
                placeholder="Type prescription for Counter (e.g., dom, cinn, ome, beta his)..."
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                disabled={!selectedPatient}
              />
            </div>

            <div className="counter-form-group">
              <label className="counter-form-label">
                Doctor Remarks
              </label>
              <textarea
                className="rx-remarks-textarea"
                placeholder="Clinical remarks or diagnosis notes for this visit..."
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                disabled={!selectedPatient}
              />
            </div>

            <button
              type="submit"
              disabled={!selectedPatient || submittingRx}
              className="submit-counter-btn"
            >
              {submittingRx ? 'SENDING TO COUNTER...' : 'SUBMIT TO COUNTER'}
            </button>
          </form>
        </aside>
      </div>

      {/* ================================================================= */}
      {/* CLINICAL DIAGNOSTIC HUB: VITALS & BMI, LAB TRENDS, FRAMINGHAM CVD */}
      {/* ================================================================= */}
      <section className="doc-diagnostic-section">
        <div className={`doc-diagnostic-card ${isDiagnosticHubMinimized ? 'is-minimized' : ''}`}>
          <div className="diagnostic-header-bar">
            <div className="diagnostic-title-area">
              <div className="diagnostic-badge-row">
                <span className="diagnostic-live-indicator">LIVE CLINICAL ANALYTICS</span>
                {selectedPatient && (
                  <span className="diagnostic-patient-tag">{selectedPatient.name}</span>
                )}
                {isDiagnosticHubMinimized && (
                  <span className="diag-minimized-pill">Hub Minimized</span>
                )}
              </div>
              <h2 className="diagnostic-main-title">Diagnostic Hub &amp; Trend Analytics</h2>
            </div>

            <div className="diagnostic-header-controls">
              {/* 3 Clickable Sub-Tabs */}
              <div className="diagnostic-tabs-nav" role="tablist">
                <button
                  type="button"
                  className={`diag-tab-btn ${docDiagnosticTab === 'vitals' ? 'active' : ''}`}
                  onClick={() => {
                    setDocDiagnosticTab('vitals');
                    setIsDiagnosticHubMinimized(false);
                  }}
                >
                  <span className="diag-tab-icon">⚖️</span>
                  <span className="diag-tab-text">Vitals &amp; BMI Tracker</span>
                  {selectedPatient && latestBmiMetrics?.bmi && (
                    <span className="diag-tab-pill" style={{ backgroundColor: latestBmiMetrics.badgeColor }}>
                      BMI {latestBmiMetrics.bmi}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className={`diag-tab-btn ${docDiagnosticTab === 'labs' ? 'active' : ''}`}
                  onClick={() => {
                    setDocDiagnosticTab('labs');
                    setIsDiagnosticHubMinimized(false);
                  }}
                >
                  <span className="diag-tab-icon">🧪</span>
                  <span className="diag-tab-text">Lab Investigation Trends</span>
                  {selectedPatient && patientLabList.length > 0 && (
                    <span className="diag-tab-pill count-pill">
                      {patientLabList.length} Tests
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className={`diag-tab-btn ${docDiagnosticTab === 'framingham' ? 'active' : ''}`}
                  onClick={() => {
                    setDocDiagnosticTab('framingham');
                    setIsDiagnosticHubMinimized(false);
                  }}
                >
                  <span className="diag-tab-icon">❤️</span>
                  <span className="diag-tab-text">Framingham CVD Risk</span>
                  {selectedPatient && cvdResult?.score && (
                    <span className="diag-tab-pill" style={{ backgroundColor: cvdResult.color }}>
                      {cvdResult.percentage}% Risk
                    </span>
                  )}
                </button>
              </div>

              {/* Minimize / Maximize Button */}
              <button
                type="button"
                className={`diag-toggle-collapse-btn ${isDiagnosticHubMinimized ? 'active-minimized' : ''}`}
                onClick={() => setIsDiagnosticHubMinimized(prev => !prev)}
                title={isDiagnosticHubMinimized ? 'Maximize Hub to view charts & entry forms' : 'Minimize Hub to compact view'}
              >
                {isDiagnosticHubMinimized ? '⤢ Expand Hub' : '— Minimize Hub'}
              </button>
            </div>
          </div>

          {!isDiagnosticHubMinimized && !selectedPatient && (
            <div className="diagnostic-empty-prompt">
              <div className="diag-empty-icon">📊</div>
              <h3>No Patient Selected</h3>
              <p>Select a patient from the queue or search above to view dynamic vitals, lab report trend charts, and cardiovascular risk assessment.</p>
            </div>
          )}

          {!isDiagnosticHubMinimized && selectedPatient && (
            <div className="diagnostic-content-container">
              {/* ========================================================= */}
              {/* SUB-TAB 1: VITALS & BMI TRACKER                           */}
              {/* ========================================================= */}
              {docDiagnosticTab === 'vitals' && (
                <div className="diag-tab-pane">
                  {/* Summary Metric Cards */}
                  <div className="diag-metrics-grid">
                    <div className="diag-metric-card">
                      <span className="diag-metric-label">Current BMI &amp; Status</span>
                      <div className="diag-metric-val-row">
                        <span className="diag-metric-main-val">
                          {latestBmiMetrics?.bmi !== null ? latestBmiMetrics.bmi : '—'}
                        </span>
                        {latestBmiMetrics?.bmi && (
                          <span className="diag-metric-badge" style={{ backgroundColor: latestBmiMetrics.badgeColor }}>
                            {latestBmiMetrics.status}
                          </span>
                        )}
                      </div>
                      <span className="diag-metric-sub">
                        {vitalsForm.weight_kg || patientVitalsList[0]?.weight_kg || '—'} kg &bull; {vitalsForm.height_cm || patientVitalsList[0]?.height_cm || '—'} cm
                      </span>
                    </div>

                    <div className="diag-metric-card target-card">
                      <span className="diag-metric-label">Target Normal Weight (BMI 23.0)</span>
                      <div className="diag-metric-val-row">
                        <span className="diag-metric-main-val">
                          {latestBmiMetrics?.targetWeightKg !== null ? `${latestBmiMetrics.targetWeightKg} kg` : '—'}
                        </span>
                        {latestBmiMetrics?.diffKg !== null && (
                          <span className={`diag-diff-badge ${latestBmiMetrics.diffKg > 0.3 ? 'diff-over' : latestBmiMetrics.diffKg < -0.3 ? 'diff-under' : 'diff-normal'}`}>
                            {latestBmiMetrics.diffKg > 0.3 ? `+${latestBmiMetrics.diffKg.toFixed(1)} kg` : latestBmiMetrics.diffKg < -0.3 ? `${latestBmiMetrics.diffKg.toFixed(1)} kg` : 'Ideal Target'}
                          </span>
                        )}
                      </div>
                      <span className="diag-metric-sub">
                        {latestBmiMetrics.summary}
                      </span>
                    </div>

                    <div className="diag-metric-card">
                      <span className="diag-metric-label">Latest Blood Pressure &amp; Pulse</span>
                      <div className="diag-metric-val-row">
                        <span className="diag-metric-main-val">
                          {patientVitalsList[0]?.systolic_bp && patientVitalsList[0]?.diastolic_bp
                            ? `${patientVitalsList[0].systolic_bp} / ${patientVitalsList[0].diastolic_bp}`
                            : '— / —'}
                        </span>
                        <span className="diag-unit-tag">mmHg</span>
                      </div>
                      <span className="diag-metric-sub">
                        Pulse: {patientVitalsList[0]?.pulse_bpm ? `${patientVitalsList[0].pulse_bpm} bpm` : '—'} &bull; {patientVitalsList[0]?.record_date ? formatClearDate(patientVitalsList[0].record_date) : 'No vitals history'}
                      </span>
                    </div>
                  </div>

                  {/* Weight & BMI Fluctuations Graph */}
                  <div className="diag-chart-card">
                    <div className="diag-chart-header">
                      <div className="diag-chart-title">
                        <h3>Weight &amp; BMI Fluctuations Across Visits</h3>
                        <p>Visual trajectory of patient weight over time with Asian normal BMI cutoff line (23.0)</p>
                      </div>
                    </div>

                    {vitalsChartData.length === 0 ? (
                      <div className="diag-chart-empty">
                        <p>No vitals records on file. Enter weight and height below to plot patient trajectory.</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 260, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={vitalsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis yAxisId="weight" orientation="left" stroke="#0284c7" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#0284c7', fontSize: 11 }} />
                            <YAxis yAxisId="bmi" orientation="right" stroke="#10b981" domain={[15, 38]} label={{ value: 'BMI', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
                            <ReferenceLine yAxisId="bmi" y={23} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Normal Cutoff (23.0)', fill: '#ef4444', fontSize: 10 }} />
                            <Line yAxisId="weight" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line yAxisId="bmi" type="monotone" dataKey="bmi" name="BMI" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Vitals Recording & Editing Form */}
                  <div className="diag-form-card">
                    <div className="diag-form-title-row">
                      <h4>{editingVitalId ? '✏️ Edit Vitals Record' : '➕ Record Patient Vitals'}</h4>
                      {editingVitalId && (
                        <button type="button" className="diag-cancel-btn" onClick={handleCancelEditVital}>
                          ✕ Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveVitals} className="diag-vitals-form">
                      <div className="diag-form-grid">
                        <div className="diag-field">
                          <label>Record Date (YYYY-MM-DD)</label>
                          <IsoDateInput
                            required
                            value={vitalsForm.record_date}
                            onChange={(val) => setVitalsForm({ ...vitalsForm, record_date: val })}
                            maxDate={getSriLankaTodayString()}
                          />
                        </div>
                        <div className="diag-field">
                          <label>Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 72.5"
                            value={vitalsForm.weight_kg}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, weight_kg: e.target.value })}
                          />
                        </div>
                        <div className="diag-field">
                          <label>Height (cm)</label>
                          <input
                            type="number"
                            step="0.5"
                            placeholder="e.g. 170"
                            value={vitalsForm.height_cm}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, height_cm: e.target.value })}
                          />
                        </div>
                        <div className="diag-field">
                          <label>Systolic BP (mmHg)</label>
                          <input
                            type="number"
                            placeholder="e.g. 120"
                            value={vitalsForm.systolic_bp}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, systolic_bp: e.target.value })}
                          />
                        </div>
                        <div className="diag-field">
                          <label>Diastolic BP (mmHg)</label>
                          <input
                            type="number"
                            placeholder="e.g. 80"
                            value={vitalsForm.diastolic_bp}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic_bp: e.target.value })}
                          />
                        </div>
                        <div className="diag-field">
                          <label>Pulse (bpm)</label>
                          <input
                            type="number"
                            placeholder="e.g. 74"
                            value={vitalsForm.pulse_bpm}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, pulse_bpm: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="diag-notes-row">
                        <label>Clinical Notes</label>
                        <input
                          type="text"
                          placeholder="Optional observations (e.g. fasting, seated, post-exertion...)"
                          value={vitalsForm.notes}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                        />
                      </div>

                      <div className="diag-actions-row">
                        <button type="submit" disabled={savingVitals} className="diag-submit-btn">
                          {savingVitals ? 'Saving...' : editingVitalId ? 'UPDATE VITALS RECORD' : 'SAVE VITALS RECORD'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Past Vitals History Table */}
                  <div className="diag-table-card">
                    <div className="diag-table-header">
                      <h4>Vitals History ({patientVitalsList.length} Entries)</h4>
                    </div>
                    {patientVitalsList.length === 0 ? (
                      <p className="diag-table-empty">No vitals entries on record for this patient.</p>
                    ) : (
                      <div className="diag-table-scroll">
                        <table className="diag-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Weight</th>
                              <th>Height</th>
                              <th>BMI</th>
                              <th>Blood Pressure</th>
                              <th>Pulse</th>
                              <th>Notes</th>
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientVitalsList.map((v) => (
                              <tr key={v.id} className={editingVitalId === v.id ? 'editing-row' : ''}>
                                <td><strong>{formatClearDate(v.record_date)}</strong></td>
                                <td>{v.weight_kg ? `${v.weight_kg} kg` : '—'}</td>
                                <td>{v.height_cm ? `${v.height_cm} cm` : '—'}</td>
                                <td>
                                  {v.bmi ? (
                                    <span className="diag-bmi-chip" style={{ backgroundColor: calculateBmiAndTargetWeight(v.weight_kg, v.height_cm).badgeColor }}>
                                      {v.bmi}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td>{v.systolic_bp && v.diastolic_bp ? `${v.systolic_bp}/${v.diastolic_bp} mmHg` : '—'}</td>
                                <td>{v.pulse_bpm ? `${v.pulse_bpm} bpm` : '—'}</td>
                                <td>{v.notes || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <div className="diag-row-actions">
                                    <button
                                      type="button"
                                      className="diag-action-btn edit"
                                      onClick={() => handleEditVital(v)}
                                      title="Edit this entry"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="diag-action-btn delete"
                                      onClick={() => handleDeleteVital(v.id)}
                                      title="Delete this entry"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SUB-TAB 2: LAB INVESTIGATION TRENDS                       */}
              {/* ========================================================= */}
              {docDiagnosticTab === 'labs' && (
                <div className="diag-tab-pane">
                  {/* Test Selector Pills */}
                  <div className="diag-test-selector-card">
                    <div className="diag-selector-label-group">
                      <span className="diag-selector-title">Select Lab Investigation</span>
                      <span className="diag-selector-desc">Choose a test to view parameter trends and enter test findings</span>
                    </div>

                    <div className="diag-test-pills">
                      {(investigationCatalog && investigationCatalog.length > 0 ? investigationCatalog : DEFAULT_INVESTIGATION_CATALOG).map((item) => {
                        const count = patientLabList.filter(l => (l.test_name || '').toLowerCase() === (item.investigation || '').toLowerCase()).length;
                        return (
                          <button
                            key={item.id || item.investigation}
                            type="button"
                            className={`diag-test-pill ${selectedCatalogTest === item.investigation ? 'active' : ''}`}
                            onClick={() => handleSelectTest(item.investigation)}
                          >
                            {item.investigation}
                            {count > 0 && <span className="diag-test-count">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Historical Trend Graph for Selected Test */}
                  {selectedConfig && (
                    <div className="diag-chart-card">
                      <div className="diag-chart-header">
                        <div className="diag-chart-title">
                          <h3>{selectedConfig.name} Historical Trends</h3>
                          <p>Fluctuations across laboratory test dates</p>
                        </div>

                        {/* Multi-parameter Sub-Metric Toggle Chips (e.g. FBC & Lipid Profile) */}
                        {selectedConfig.chartMetrics && selectedConfig.chartMetrics.length > 1 && (
                          <div className="diag-metric-chips">
                            {selectedConfig.chartMetrics.map((m) => (
                              <button
                                key={m.key}
                                type="button"
                                className={`diag-chip-btn ${selectedLabMetricToGraph === m.key ? 'active' : ''}`}
                                onClick={() => setSelectedLabMetricToGraph(m.key)}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {filteredLabRecordsForGraph.length === 0 ? (
                        <div className="diag-chart-empty">
                          <p>No historical lab reports recorded for <strong>{selectedCatalogTest}</strong> yet. Enter findings below to begin tracking.</p>
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: 260, minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={filteredLabRecordsForGraph} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#475569" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />

                              {/* Render lines dynamically based on selected metric toggle */}
                              {selectedLabMetricToGraph === 'all'
                                ? selectedConfig.chartMetrics
                                    .filter(m => m.key !== 'all')
                                    .map(m => (
                                      <Line
                                        key={m.key}
                                        type="monotone"
                                        dataKey={m.key}
                                        name={m.label}
                                        stroke={m.color || '#0284c7'}
                                        strokeWidth={2.5}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        connectNulls
                                      />
                                    ))
                                : selectedConfig.chartMetrics
                                    .filter(m => m.key === selectedLabMetricToGraph)
                                    .map(m => (
                                      <Line
                                        key={m.key}
                                        type="monotone"
                                        dataKey={m.key}
                                        name={m.label}
                                        stroke={m.color || '#0284c7'}
                                        strokeWidth={3}
                                        dot={{ r: 5 }}
                                        activeDot={{ r: 7 }}
                                        connectNulls
                                      />
                                    ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clean, Dynamic Test-Specific Data Entry Form */}
                  <div className="diag-form-card">
                    <div className="diag-form-title-row">
                      <h4>
                        {editingLabId ? `✏️ Edit ${selectedCatalogTest} Report` : `➕ Enter ${selectedCatalogTest} Findings`}
                      </h4>
                      {editingLabId && (
                        <button type="button" className="diag-cancel-btn" onClick={handleCancelEditLab}>
                          ✕ Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveLabResult} className="diag-lab-form">
                      <div className="diag-date-row">
                        <label>Report Date (YYYY-MM-DD)</label>
                        <IsoDateInput
                          required
                          value={labForm.test_date}
                          onChange={(val) => setLabForm({ ...labForm, test_date: val })}
                          maxDate={getSriLankaTodayString()}
                        />
                      </div>

                      {/* Clean dynamic fields: only the ones for selected test */}
                      <div className="diag-lab-fields-grid">
                        {selectedConfig?.fields.map((f) => (
                          <div key={f.key} className="diag-lab-field">
                            <div className="diag-field-label-line">
                              <label>{f.label}</label>
                              {f.normal && <span className="diag-normal-range">Normal: {f.normal}</span>}
                            </div>
                            <div className="diag-input-with-unit">
                              <input
                                type={f.isText ? 'text' : 'number'}
                                step={f.step || 'any'}
                                placeholder={f.unit ? `Value (${f.unit})` : 'Enter value'}
                                value={labForm.results[f.key] !== undefined ? labForm.results[f.key] : ''}
                                onChange={(e) => handleLabResultChange(f.key, e.target.value)}
                              />
                              {f.unit && <span className="diag-unit-suffix">{f.unit}</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="diag-notes-row" style={{ marginTop: '14px' }}>
                        <label>Doctor Remarks / Interpretation</label>
                        <input
                          type="text"
                          placeholder="Clinical interpretation or pathology remarks..."
                          value={labForm.remarks}
                          onChange={(e) => setLabForm({ ...labForm, remarks: e.target.value })}
                        />
                      </div>

                      <div className="diag-actions-row">
                        <button type="submit" disabled={savingLab} className="diag-submit-btn">
                          {savingLab ? 'Saving...' : editingLabId ? 'UPDATE LAB REPORT' : 'SAVE LAB REPORT'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Past Lab Reports History Table */}
                  <div className="diag-table-card">
                    <div className="diag-table-header">
                      <h4>Patient Laboratory Reports ({patientLabList.length} Tests)</h4>
                    </div>
                    {patientLabList.length === 0 ? (
                      <p className="diag-table-empty">No laboratory investigation reports recorded for this patient.</p>
                    ) : (
                      <div className="diag-table-scroll">
                        <table className="diag-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Test Name</th>
                              <th>Results Summary</th>
                              <th>Doctor Remarks</th>
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientLabList.map((lab) => (
                              <tr key={lab.id} className={editingLabId === lab.id ? 'editing-row' : ''}>
                                <td><strong>{formatClearDate(lab.test_date)}</strong></td>
                                <td>
                                  <span className="diag-test-name-tag">{lab.test_name}</span>
                                </td>
                                <td>
                                  <div className="diag-results-summary">
                                    {lab.results && typeof lab.results === 'object' ? (
                                      Object.entries(lab.results).map(([k, v]) => (
                                        <span key={k} className="diag-result-tag">
                                          <strong>{k.toUpperCase()}:</strong> {v}
                                        </span>
                                      ))
                                    ) : '—'}
                                  </div>
                                </td>
                                <td>{lab.remarks || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <div className="diag-row-actions">
                                    <button
                                      type="button"
                                      className="diag-action-btn edit"
                                      onClick={() => handleEditLabResult(lab)}
                                      title="Edit this report"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="diag-action-btn delete"
                                      onClick={() => handleDeleteLabResult(lab.id)}
                                      title="Delete this report"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SUB-TAB 3: FRAMINGHAM CARDIOVASCULAR RISK                 */}
              {/* ========================================================= */}
              {docDiagnosticTab === 'framingham' && (
                <div className="diag-tab-pane">
                  <div className="framingham-header-card">
                    <div className="framingham-title-area">
                      <div className="framingham-badge-row">
                        <span className="framingham-tag">D'Agostino et al. (2008) Standard Algorithm</span>
                      </div>
                      <h3>Framingham 10-Year General CVD Risk Calculator</h3>
                      <p>Predicts 10-year risk of cardiovascular disease (coronary, cerebrovascular, peripheral artery disease, and heart failure).</p>
                    </div>
                    <button
                      type="button"
                      className="framingham-sync-btn"
                      onClick={handleAutoFillFramingham}
                      title="Re-read current patient profile, latest vitals, and lipid profile"
                    >
                      🔄 Auto-Fill from Latest Records
                    </button>
                  </div>

                  <div className="framingham-main-grid">
                    {/* Input Parameters Panel */}
                    <div className="framingham-inputs-card">
                      <h4>Clinical Parameters</h4>
                      <div className="framingham-grid">
                        <div className="diag-field">
                          <label>Age (Years)</label>
                          <input
                            type="number"
                            min="20"
                            max="85"
                            value={cvdAge}
                            onChange={(e) => setCvdAge(e.target.value)}
                          />
                        </div>

                        <div className="diag-field">
                          <label>Biological Sex</label>
                          <div className="toggle-pill-group">
                            <button
                              type="button"
                              className={`toggle-pill ${cvdGender === '1' ? 'active' : ''}`}
                              onClick={() => setCvdGender('1')}
                            >
                              Male
                            </button>
                            <button
                              type="button"
                              className={`toggle-pill ${cvdGender === '0' ? 'active' : ''}`}
                              onClick={() => setCvdGender('0')}
                            >
                              Female
                            </button>
                          </div>
                        </div>

                        <div className="diag-field">
                          <label>Systolic Blood Pressure (mmHg)</label>
                          <input
                            type="number"
                            placeholder="e.g. 130"
                            value={cvdSBP}
                            onChange={(e) => setCvdSBP(e.target.value)}
                          />
                        </div>

                        <div className="diag-field">
                          <label>BP Medication Status</label>
                          <div className="toggle-pill-group">
                            <button
                              type="button"
                              className={`toggle-pill ${!cvdIsTreated ? 'active' : ''}`}
                              onClick={() => setCvdIsTreated(false)}
                            >
                              Untreated
                            </button>
                            <button
                              type="button"
                              className={`toggle-pill ${cvdIsTreated ? 'active' : ''}`}
                              onClick={() => setCvdIsTreated(true)}
                            >
                              Treated
                            </button>
                          </div>
                        </div>

                        <div className="diag-field">
                          <label>Total Cholesterol (mg/dL)</label>
                          <input
                            type="number"
                            placeholder="e.g. 200"
                            value={cvdTotalChol}
                            onChange={(e) => setCvdTotalChol(e.target.value)}
                          />
                        </div>

                        <div className="diag-field">
                          <label>HDL Cholesterol (mg/dL)</label>
                          <input
                            type="number"
                            placeholder="e.g. 45"
                            value={cvdHDL}
                            onChange={(e) => setCvdHDL(e.target.value)}
                          />
                        </div>

                        <div className="diag-field">
                          <label>Cigarette Smoker?</label>
                          <div className="toggle-pill-group">
                            <button
                              type="button"
                              className={`toggle-pill ${!cvdIsSmoker ? 'active' : ''}`}
                              onClick={() => setCvdIsSmoker(false)}
                            >
                              Non-Smoker
                            </button>
                            <button
                              type="button"
                              className={`toggle-pill ${cvdIsSmoker ? 'active alert-active' : ''}`}
                              onClick={() => setCvdIsSmoker(true)}
                            >
                              Current Smoker
                            </button>
                          </div>
                        </div>

                        <div className="diag-field">
                          <label>Diagnosed with Diabetes?</label>
                          <div className="toggle-pill-group">
                            <button
                              type="button"
                              className={`toggle-pill ${!cvdIsDiabetic ? 'active' : ''}`}
                              onClick={() => setCvdIsDiabetic(false)}
                            >
                              No Diabetes
                            </button>
                            <button
                              type="button"
                              className={`toggle-pill ${cvdIsDiabetic ? 'active alert-active' : ''}`}
                              onClick={() => setCvdIsDiabetic(true)}
                            >
                              Diabetic
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculated Risk Display Panel */}
                    <div className="framingham-result-card">
                      <span className="framingham-res-tag">ESTIMATED 10-YEAR RISK</span>

                      <div className="framingham-score-display">
                        <span className="framingham-score-num" style={{ color: cvdResult.color }}>
                          {cvdResult.percentage ? `${cvdResult.percentage}%` : '—'}
                        </span>
                        <span className="framingham-score-label">
                          10-Year Cardiovascular Event Risk
                        </span>
                      </div>

                      {cvdResult.category && (
                        <div className="framingham-category-pill" style={{ backgroundColor: cvdResult.color }}>
                          {cvdResult.category === 'LOW' && '🟢 LOW RISK (< 10%)'}
                          {cvdResult.category === 'MODERATE' && '🟡 MODERATE RISK (10% – 20%)'}
                          {cvdResult.category === 'HIGH' && '🔴 HIGH RISK (> 20%)'}
                          {cvdResult.category === 'INCOMPLETE' && '⚪ Incomplete Data'}
                        </div>
                      )}

                      {/* Visual Risk Gauge Meter */}
                      <div className="framingham-gauge-container">
                        <div className="framingham-gauge-bar">
                          <div className="gauge-segment gauge-low" title="Low Risk (<10%)"></div>
                          <div className="gauge-segment gauge-moderate" title="Moderate Risk (10-20%)"></div>
                          <div className="gauge-segment gauge-high" title="High Risk (>20%)"></div>
                        </div>
                        {cvdResult.percentage > 0 && (
                          <div
                            className="framingham-gauge-needle"
                            style={{
                              left: `${Math.min(95, Math.max(5, (cvdResult.percentage / 30) * 100))}%`
                            }}
                          >
                            ▲
                          </div>
                        )}
                        <div className="gauge-labels">
                          <span>0%</span>
                          <span>10%</span>
                          <span>20%</span>
                          <span>30%+</span>
                        </div>
                      </div>

                      {/* Comparative Bar Chart: Current vs Optimal */}
                      {cvdResult.percentage > 0 && (
                        <div className="framingham-bar-chart-card">
                          <div className="framingham-bar-chart-header">
                            <span className="framingham-chart-label">Risk Comparison vs. Optimal Target</span>
                          </div>
                          <div style={{ width: '100%', height: 160, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={160}>
                              <BarChart data={framinghamBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                                <YAxis unit="%" stroke="#64748b" fontSize={10} domain={[0, 'auto']} />
                                <Tooltip
                                  formatter={(val) => [`${val}%`, '10-Yr CVD Risk']}
                                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                                />
                                <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
                                  {framinghamBarData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <div className="framingham-advice-box">
                        <h5>Clinical Guidance:</h5>
                        <p>{cvdResult.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="doc-history-section" id="doc-history-section">
        <div className="doc-history-card">
          <div className="history-title-bar">
            <h2>
              Consultation &amp; Prescription Log {selectedPatient ? `— ${selectedPatient.name}` : ''}
            </h2>
            <span className="history-count-label">
              {prescriptionHistory.length} Past Visits
            </span>
          </div>

          {!selectedPatient ? (
            <p style={{ color: '#64748b', fontSize: '0.98rem', fontWeight: 500 }}>
              Select a patient above to view their historical prescriptions and visit remarks.
            </p>
          ) : prescriptionHistory.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.98rem', fontWeight: 500 }}>
              No previous consultation records found for this patient.
            </p>
          ) : (
            <div>
              <div className="history-grid-header">
                <div>Visit Date</div>
                <div>Prescription</div>
                <div>Doctor&apos;s Remarks</div>
                <div style={{ textAlign: 'center' }}>Quick Action</div>
              </div>

              <div className="history-log-list">
                {prescriptionHistory.map((item) => (
                  <div key={item.id} className="history-log-item">
                    <div className="history-date-col">
                      <span className="history-date-main">
                        {formatClearDate(item.visit_date)}
                      </span>
                      <span className="history-date-sub">
                        Recorded Visit
                      </span>
                    </div>

                    <div className="history-rx-col">
                      {item.general}
                    </div>

                    <div className="history-remarks-col">
                      {item.reason_remarks ? (
                        item.reason_remarks
                      ) : (
                        <span className="history-remarks-empty">No remarks recorded</span>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        className="repeat-rx-btn"
                        onClick={() => {
                          setPrescriptionText(item.general);
                        }}
                      >
                        Copy to Today
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}