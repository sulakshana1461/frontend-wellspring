import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

export const DOCTOR_THEMES = [
  { id: 'ocean', name: 'Ocean Medical Blue', swatch: '#0284c7' },
  { id: 'navy', name: 'Royal Hospital Navy', swatch: '#1e3a8a' },
  { id: 'teal', name: 'Clinical Teal', swatch: '#0f766e' },
  { id: 'indigo', name: 'Modern Slate Indigo', swatch: '#3730a3' }
];

export function calculateAge(birthDateString) {
  if (!birthDateString) return 'Not Recorded';
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return 'Not Recorded';
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--; months += 12;
  }
  if (years < 1) return `${Math.max(0, months)} Months`;
  return `${years} Years`;
}

export function formatClearDate(dateString) {
  if (!dateString) return 'Not Recorded';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Render in Sri Lanka Time
  return new Intl.DateTimeFormat('en-GB', { 
    timeZone: 'Asia/Colombo',
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).format(date);
}

export function getSriLankaTodayString() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

// -------------------------------------------------------------
// DYNAMIC BMI & TARGET WEIGHT CALCULATION (WHO Asian Cutoff = 23.0)
// Target Weight (kg) = 23.0 * (Height in m)^2
// -------------------------------------------------------------
export function calculateBmiAndTargetWeight(weightKg, heightCm) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (!w || !h || w <= 0 || h <= 0) {
    return {
      bmi: null,
      targetWeightKg: null,
      diffKg: null,
      status: 'No Data',
      badgeColor: '#94a3b8',
      summary: 'Record weight and height to view BMI and target analysis.'
    };
  }

  const hm = h / 100;
  const bmi = Math.round((w / (hm * hm)) * 10) / 10;
  const targetWeightKg = Math.round((23.0 * hm * hm) * 10) / 10;
  const diffKg = Math.round((w - targetWeightKg) * 10) / 10;

  let status = 'Normal Weight';
  let badgeColor = '#10b981'; // green

  if (bmi < 18.5) {
    status = 'Underweight';
    badgeColor = '#3b82f6'; // blue
  } else if (bmi <= 22.9) {
    status = 'Normal (Healthy)';
    badgeColor = '#10b981'; // emerald
  } else if (bmi <= 27.4) {
    status = 'Overweight';
    badgeColor = '#f59e0b'; // amber
  } else {
    status = 'Obese';
    badgeColor = '#ef4444'; // red
  }

  let summary = '';
  if (diffKg > 0.3) {
    summary = `${diffKg.toFixed(1)} kg above target normal weight (for BMI 23.0)`;
  } else if (diffKg < -0.3) {
    summary = `${Math.abs(diffKg).toFixed(1)} kg below target normal weight (for BMI 23.0)`;
  } else {
    summary = 'At ideal target weight for healthy BMI (23.0)';
  }

  return { bmi, targetWeightKg, diffKg, status, badgeColor, summary };
}

// -------------------------------------------------------------
// FRAMINGHAM 10-YEAR GENERAL CARDIOVASCULAR DISEASE RISK (D'Agostino 2008)
// Validated clinical equation for 10-year CVD risk percentage
// -------------------------------------------------------------
export function calculateFraminghamCvd({ age, gender, totalChol, hdl, sbp, isTreated, isSmoker, isDiabetic }) {
  const ageNum = Number(age) || 0;
  const tcNum = Number(totalChol) || 0;
  const hdlNum = Number(hdl) || 0;
  const sbpNum = Number(sbp) || 0;
  const isMale = Number(gender) === 1;

  if (ageNum < 20 || ageNum > 85 || tcNum <= 0 || hdlNum <= 0 || sbpNum <= 0) {
    return {
      score: null,
      percentage: 0,
      category: 'INCOMPLETE',
      color: '#94a3b8',
      message: 'Enter Age (20–85), Total Cholesterol, HDL, and Systolic BP to calculate 10-year CVD risk.'
    };
  }

  const lnAge = Math.log(ageNum);
  const lnTC = Math.log(tcNum);
  const lnHDL = Math.log(hdlNum);
  const lnSBP = Math.log(sbpNum);

  let L = 0;
  let meanL = 0;
  let baselineS = 0;

  if (isMale) {
    meanL = 23.9802;
    baselineS = 0.88936;
    L = (3.06117 * lnAge) +
        (1.12370 * lnTC) -
        (0.93263 * lnHDL) +
        ((isTreated ? 1.99881 : 1.93303) * lnSBP) +
        (isSmoker ? 0.65451 : 0) +
        (isDiabetic ? 0.57367 : 0);
  } else {
    meanL = 26.1931;
    baselineS = 0.95012;
    L = (2.32888 * lnAge) +
        (1.20904 * lnTC) -
        (0.70833 * lnHDL) +
        ((isTreated ? 2.82263 : 2.76157) * lnSBP) +
        (isSmoker ? 0.52873 : 0) +
        (isDiabetic ? 0.69154 : 0);
  }

  const risk = 1 - Math.pow(baselineS, Math.exp(L - meanL));
  let pct = Math.round(risk * 1000) / 10;
  if (pct < 1) pct = 1;
  if (pct > 95) pct = 95;

  let category = 'LOW';
  let color = '#10b981'; // green
  let message = 'Low 10-year CVD risk (<10%). Encourage heart-healthy diet, regular physical exercise, and maintenance of healthy weight.';

  if (pct >= 20) {
    category = 'HIGH';
    color = '#ef4444'; // red
    message = 'High 10-year CVD risk (>20%). Intensive clinical risk management recommended: consider statin therapy, tight blood pressure control, and antiplatelet therapy as appropriate.';
  } else if (pct >= 10) {
    category = 'MODERATE';
    color = '#f59e0b'; // amber
    message = 'Moderate / Intermediate 10-year CVD risk (10–20%). Consider lifestyle interventions, dietary adjustments, and statin evaluation based on LDL levels.';
  }

  return { score: pct, percentage: pct, category, color, message };
}

// -------------------------------------------------------------
// INVESTIGATION SCHEMA & METRIC CONFIG
// -------------------------------------------------------------
export const INVESTIGATION_CONFIG = {
  'FBC': {
    name: 'FBC (Full Blood Count)',
    isMultiMetric: true,
    fields: [
      { key: 'hb', label: 'Hemoglobin (Hb)', unit: 'g/dL', normal: '12.0 – 17.5', step: '0.1' },
      { key: 'wbc', label: 'WBC (Total)', unit: '/µL', normal: '4,000 – 11,000', step: '50' },
      { key: 'platelets', label: 'Platelet Count', unit: 'x10³/µL', normal: '150 – 450', step: '1' },
      { key: 'pcv', label: 'PCV / Hematocrit', unit: '%', normal: '36.0 – 50.0', step: '0.1' },
      { key: 'neutrophils', label: 'Neutrophils', unit: '%', normal: '40 – 75', step: '0.1' },
      { key: 'lymphocytes', label: 'Lymphocytes', unit: '%', normal: '20 – 45', step: '0.1' },
      { key: 'eosinophils', label: 'Eosinophils', unit: '%', normal: '1 – 6', step: '0.1' }
    ],
    chartMetrics: [
      { key: 'all', label: 'Overview' },
      { key: 'hb', label: 'Hb (g/dL)', color: '#ef4444' },
      { key: 'platelets', label: 'Platelets (x10³)', color: '#8b5cf6' },
      { key: 'wbc', label: 'WBC (/µL)', color: '#0284c7' },
      { key: 'pcv', label: 'PCV (%)', color: '#10b981' },
      { key: 'neutrophils', label: 'Neutrophils (%)', color: '#f59e0b' },
      { key: 'lymphocytes', label: 'Lymphocytes (%)', color: '#06b6d4' }
    ]
  },
  'Lipid Profile': {
    name: 'Lipid Profile',
    isMultiMetric: true,
    fields: [
      { key: 'total_chol', label: 'Total Cholesterol', unit: 'mg/dL', normal: '< 200', step: '1' },
      { key: 'tg', label: 'Triglycerides', unit: 'mg/dL', normal: '< 150', step: '1' },
      { key: 'hdl', label: 'HDL (Good Chol)', unit: 'mg/dL', normal: '> 40 (M), > 50 (F)', step: '1' },
      { key: 'ldl', label: 'LDL (Bad Chol)', unit: 'mg/dL', normal: '< 100', step: '1' },
      { key: 'vldl', label: 'VLDL', unit: 'mg/dL', normal: '< 30', step: '1' }
    ],
    chartMetrics: [
      { key: 'all', label: 'All Lipids' },
      { key: 'total_chol', label: 'Total Chol', color: '#ef4444' },
      { key: 'ldl', label: 'LDL Chol', color: '#f59e0b' },
      { key: 'hdl', label: 'HDL Chol', color: '#10b981' },
      { key: 'tg', label: 'Triglycerides', color: '#8b5cf6' }
    ]
  },
  'FBS': {
    name: 'FBS (Fasting Blood Sugar)',
    isMultiMetric: false,
    fields: [
      { key: 'fbs', label: 'Fasting Blood Sugar', unit: 'mg/dL', normal: '70 – 100 (Normal)', step: '1' }
    ],
    chartMetrics: [
      { key: 'fbs', label: 'FBS (mg/dL)', color: '#0284c7', normalMin: 70, normalMax: 100 }
    ]
  },
  'HBA1C': {
    name: 'HBA1C (Hemoglobin A1C)',
    isMultiMetric: false,
    fields: [
      { key: 'hba1c', label: 'HbA1c Level', unit: '%', normal: '< 5.7% (Normal), 5.7–6.4 (Pre-DM), ≥6.5 (DM)', step: '0.1' }
    ],
    chartMetrics: [
      { key: 'hba1c', label: 'HbA1c (%)', color: '#f59e0b', normalMax: 5.7 }
    ]
  },
  'ESR': {
    name: 'ESR (Erythrocyte Sedimentation Rate)',
    isMultiMetric: false,
    fields: [
      { key: 'esr', label: 'ESR (1st Hour)', unit: 'mm/hr', normal: '0 – 20', step: '1' }
    ],
    chartMetrics: [
      { key: 'esr', label: 'ESR (mm/hr)', color: '#ec4899', normalMax: 20 }
    ]
  },
  'CRP': {
    name: 'CRP (C-Reactive Protein)',
    isMultiMetric: false,
    fields: [
      { key: 'crp', label: 'C-Reactive Protein', unit: 'mg/L', normal: '< 5.0 (Normal)', step: '0.1' }
    ],
    chartMetrics: [
      { key: 'crp', label: 'CRP (mg/L)', color: '#dc2626', normalMax: 5.0 }
    ]
  },
  'BUN': {
    name: 'BUN (Blood Urea Nitrogen)',
    isMultiMetric: false,
    fields: [
      { key: 'bun', label: 'Blood Urea Nitrogen', unit: 'mg/dL', normal: '7 – 20', step: '0.1' }
    ],
    chartMetrics: [
      { key: 'bun', label: 'BUN (mg/dL)', color: '#8b5cf6', normalMin: 7, normalMax: 20 }
    ]
  },
  'SCR': {
    name: 'SCR (Serum Creatinine)',
    isMultiMetric: true,
    fields: [
      { key: 'scr', label: 'Serum Creatinine', unit: 'mg/dL', normal: '0.6 – 1.2', step: '0.01' },
      { key: 'egfr', label: 'eGFR', unit: 'mL/min/1.73m²', normal: '> 90', step: '1' }
    ],
    chartMetrics: [
      { key: 'scr', label: 'Creatinine (mg/dL)', color: '#6366f1', normalMin: 0.6, normalMax: 1.2 },
      { key: 'egfr', label: 'eGFR (mL/min)', color: '#10b981', normalMin: 90 }
    ]
  },
  'UFR': {
    name: 'UFR (Uroflowmetry / Urine Full Report)',
    isMultiMetric: true,
    fields: [
      { key: 'pus_cells', label: 'Pus Cells', unit: '/hpf', normal: '0 – 5', isText: true },
      { key: 'rbc', label: 'Red Blood Cells (RBC)', unit: '/hpf', normal: '0 – 2', isText: true },
      { key: 'epithelial', label: 'Epithelial Cells', unit: '/hpf', normal: 'Occasional', isText: true },
      { key: 'albumin', label: 'Albumin / Protein', unit: '', normal: 'Nil / Negative', isText: true },
      { key: 'sugar', label: 'Sugar', unit: '', normal: 'Nil', isText: true }
    ],
    chartMetrics: []
  },
  'TSH': {
    name: 'TSH (Thyroid Stimulating Hormone)',
    isMultiMetric: false,
    fields: [
      { key: 'tsh', label: 'TSH Level', unit: 'µIU/mL', normal: '0.4 – 4.5', step: '0.01' }
    ],
    chartMetrics: [
      { key: 'tsh', label: 'TSH (µIU/mL)', color: '#0d9488', normalMin: 0.4, normalMax: 4.5 }
    ]
  },
  'Thyroxine': {
    name: 'Thyroxine (Free T4 / Total T4)',
    isMultiMetric: true,
    fields: [
      { key: 'ft4', label: 'Free T4 (FT4)', unit: 'ng/dL', normal: '0.8 – 1.8', step: '0.01' },
      { key: 'total_t4', label: 'Total T4', unit: 'µg/dL', normal: '4.5 – 12.0', step: '0.1' }
    ],
    chartMetrics: [
      { key: 'ft4', label: 'FT4 (ng/dL)', color: '#0284c7', normalMin: 0.8, normalMax: 1.8 },
      { key: 'total_t4', label: 'Total T4 (µg/dL)', color: '#7c3aed', normalMin: 4.5, normalMax: 12.0 }
    ]
  },
  'Thiroxing': {
    name: 'Thyroxine (Free T4 / Total T4)',
    isMultiMetric: true,
    fields: [
      { key: 'ft4', label: 'Free T4 (FT4)', unit: 'ng/dL', normal: '0.8 – 1.8', step: '0.01' },
      { key: 'total_t4', label: 'Total T4', unit: 'µg/dL', normal: '4.5 – 12.0', step: '0.1' }
    ],
    chartMetrics: [
      { key: 'ft4', label: 'FT4 (ng/dL)', color: '#0284c7', normalMin: 0.8, normalMax: 1.8 },
      { key: 'total_t4', label: 'Total T4 (µg/dL)', color: '#7c3aed', normalMin: 4.5, normalMax: 12.0 }
    ]
  },
  'SGPT': {
    name: 'SGPT (ALT Liver Enzyme)',
    isMultiMetric: false,
    fields: [
      { key: 'sgpt', label: 'SGPT / ALT', unit: 'U/L', normal: '< 45', step: '1' }
    ],
    chartMetrics: [
      { key: 'sgpt', label: 'SGPT (U/L)', color: '#e11d48', normalMax: 45 }
    ]
  },
  'Others': {
    name: 'Other Investigation',
    isMultiMetric: false,
    fields: [
      { key: 'param_name', label: 'Test / Parameter Name', unit: '', normal: '', isText: true },
      { key: 'value', label: 'Observed Value', unit: '', normal: '', step: '0.01' },
      { key: 'unit', label: 'Unit of Measure', unit: '', normal: '', isText: true }
    ],
    chartMetrics: [
      { key: 'value', label: 'Value', color: '#475569' }
    ]
  }
};

export const DEFAULT_INVESTIGATION_CATALOG = [
  { id: 1, investigation: 'FBC', remarks: 'Full Blood Count' },
  { id: 2, investigation: 'Lipid Profile', remarks: 'Lipid Profile' },
  { id: 3, investigation: 'FBS', remarks: 'Fasting Blood Sugar' },
  { id: 4, investigation: 'HBA1C', remarks: 'Hemoglobin A1C' },
  { id: 5, investigation: 'ESR', remarks: 'Erythrocyte Sedimentation Rate' },
  { id: 6, investigation: 'CRP', remarks: 'C-Reactive Protein' },
  { id: 7, investigation: 'BUN', remarks: 'Blood Urea Nitrogen' },
  { id: 8, investigation: 'Serum Creatinine', remarks: 'Serum Creatinine (SCR)' },
  { id: 9, investigation: 'Liver Profile', remarks: 'Liver Profile (SGOT / SGPT / AST / ALT)' },
  { id: 10, investigation: 'UFR', remarks: 'Urine Full Report' },
  { id: 11, investigation: 'Thyroxine', remarks: 'Thyroxine (Free T4 / Total T4)' },
  { id: 12, investigation: 'Uric Acid', remarks: 'Serum Uric Acid' },
  { id: 13, investigation: 'Others', remarks: 'Clinical Laboratory Findings' }
];

export function useDoctorPortalLogic() {
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('wellspring_doc_theme') || 'teal');
  useEffect(() => { localStorage.setItem('wellspring_doc_theme', activeTheme); }, [activeTheme]);

  const [loggedInDoctor, setLoggedInDoctor] = useState(() => {
    const saved = sessionStorage.getItem('wellspring_doctor_session') || localStorage.getItem('wellspring_doctor_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [sidebarTab, setSidebarTab] = useState('queue');
  const [queueList, setQueueList] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const [advancedSearch, setAdvancedSearch] = useState({ name: '', nic: '', phone: '', dob: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);
  const [searching, setSearching] = useState(false);

  const [newPatientForm, setNewPatientForm] = useState({
    name: '', birth_date: '', phone: '', id_number: '', gender: '', married: '0', weight: '', height: '', common: ''
  });
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Editable Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Editable Birth Date State
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState('');
  const [savingBirthDate, setSavingBirthDate] = useState(false);

  const [isEditingMarital, setIsEditingMarital] = useState(false);
  const [maritalValue, setMaritalValue] = useState('0');
  const [savingMarital, setSavingMarital] = useState(false);

  // Editable Gender State
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [genderValue, setGenderValue] = useState('1');
  const [savingGender, setSavingGender] = useState(false);

  // Editable Phone State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const [commonText, setCommonText] = useState('');
  const [isEditingCommon, setIsEditingCommon] = useState(false);
  const [savingCommon, setSavingCommon] = useState(false);

  const [allergiesText, setAllergiesText] = useState('');
  const [isEditingAllergies, setIsEditingAllergies] = useState(false);
  const [savingAllergies, setSavingAllergies] = useState(false);

  const [prescriptionText, setPrescriptionText] = useState(() => sessionStorage.getItem('draft_rx_general') || '');
  const [remarksText, setRemarksText] = useState('');
  const [submittingRx, setSubmittingRx] = useState(false);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);

  const [bellCooldown, setBellCooldown] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  // -------------------------------------------------------------
  // NEW: DIAGNOSTIC HUB & ANALYTICS STATE
  // Sub-tabs: 'vitals', 'labs', 'framingham'
  // -------------------------------------------------------------
  const [docDiagnosticTab, setDocDiagnosticTab] = useState('vitals');

  // Vitals State
  const [patientVitalsList, setPatientVitalsList] = useState([]);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [editingVitalId, setEditingVitalId] = useState(null);
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    record_date: getSriLankaTodayString(),
    weight_kg: '',
    height_cm: '',
    systolic_bp: '',
    diastolic_bp: '',
    pulse_bpm: '',
    notes: ''
  });

  // Lab Investigation Catalog & Patient Labs State
  const [investigationCatalog, setInvestigationCatalog] = useState(DEFAULT_INVESTIGATION_CATALOG);
  const [selectedCatalogTest, setSelectedCatalogTest] = useState('FBC');
  const [patientLabList, setPatientLabList] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [editingLabId, setEditingLabId] = useState(null);
  const [savingLab, setSavingLab] = useState(false);
  const [selectedLabMetricToGraph, setSelectedLabMetricToGraph] = useState('all');
  const [labForm, setLabForm] = useState({
    test_name: 'FBC',
    test_date: getSriLankaTodayString(),
    results: {},
    remarks: ''
  });

  // Framingham CVD State
  const [cvdAge, setCvdAge] = useState(45);
  const [cvdGender, setCvdGender] = useState('1'); // '1' = Male, '0' = Female
  const [cvdTotalChol, setCvdTotalChol] = useState(190);
  const [cvdHDL, setCvdHDL] = useState(45);
  const [cvdSBP, setCvdSBP] = useState(120);
  const [cvdIsTreated, setCvdIsTreated] = useState(false);
  const [cvdIsSmoker, setCvdIsSmoker] = useState(false);
  const [cvdIsDiabetic, setCvdIsDiabetic] = useState(false);

  const showToast = (message, type = 'success') => {
    setStatusBanner({ message, type });
    setTimeout(() => setStatusBanner(null), 3500);
  };

  // Draft protection: autosave prescription and remarks per patient
  useEffect(() => {
    if (selectedPatient?.id) {
      sessionStorage.setItem(`draft_rx_${selectedPatient.id}`, prescriptionText);
      sessionStorage.setItem(`draft_remarks_${selectedPatient.id}`, remarksText);
    }
  }, [prescriptionText, remarksText, selectedPatient]);

  const fetchInvestigationCatalog = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/doctor/investigation-catalog`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setInvestigationCatalog(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch investigation catalog:', err.message);
    }
  }, []);

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoggingIn(true);
    try {
      const res = await axios.post(`${API_BASE}/doctor/login`, { username: loginUsername, password: loginPassword });
      setLoggedInDoctor(res.data);
      sessionStorage.setItem('wellspring_doctor_session', JSON.stringify(res.data));
      localStorage.setItem('wellspring_doctor_session', JSON.stringify(res.data));
      setLoginPassword('');
      fetchInvestigationCatalog();
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Unable to sign in. Check your credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleDoctorLogout = () => {
    sessionStorage.removeItem('wellspring_doctor_session');
    localStorage.removeItem('wellspring_doctor_session');
    setLoggedInDoctor(null); setSelectedPatient(null); setActiveTicketId(null);
  };

  const fetchQueue = useCallback(async () => {
    if (!loggedInDoctor) return;
    setLoadingQueue(true);
    try {
      const res = await axios.get(`${API_BASE}/doctor/queue`);
      setQueueList(res.data || []);
    } catch (err) {
      console.error('Failed to load queue:', err.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [loggedInDoctor]);

  useEffect(() => {
    if (!loggedInDoctor) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue, loggedInDoctor]);

  // Load investigation catalog on mount and whenever doctor logs in or switches to labs sub-tab
  useEffect(() => {
    fetchInvestigationCatalog();
  }, [fetchInvestigationCatalog, loggedInDoctor]);

  useEffect(() => {
    if (docDiagnosticTab === 'labs') {
      fetchInvestigationCatalog();
    }
  }, [docDiagnosticTab, fetchInvestigationCatalog]);

  // Fetch Vitals for a patient (sorted newest first for history table & latest metric cards)
  const fetchPatientVitals = useCallback(async (patientId) => {
    if (!patientId) return [];
    setLoadingVitals(true);
    try {
      const res = await axios.get(`${API_BASE}/doctor/patients/${patientId}/vitals`);
      const vitals = (res.data || []).sort(
        (a, b) => (new Date(b.record_date) - new Date(a.record_date)) || ((b.id || 0) - (a.id || 0))
      );
      setPatientVitalsList(vitals);
      return vitals;
    } catch (err) {
      console.error('Error fetching vitals:', err.message);
      setPatientVitalsList([]);
      return [];
    } finally {
      setLoadingVitals(false);
    }
  }, []);

  // Fetch Investigations for a patient (sorted newest first for history table & latest metrics)
  const fetchPatientInvestigations = useCallback(async (patientId) => {
    if (!patientId) return [];
    setLoadingLabs(true);
    try {
      const res = await axios.get(`${API_BASE}/doctor/patients/${patientId}/investigations`);
      const labs = (res.data || []).sort(
        (a, b) => (new Date(b.test_date) - new Date(a.test_date)) || ((b.id || 0) - (a.id || 0))
      );
      setPatientLabList(labs);
      return labs;
    } catch (err) {
      console.error('Error fetching investigations:', err.message);
      setPatientLabList([]);
      return [];
    } finally {
      setLoadingLabs(false);
    }
  }, []);

  // Auto-populate Framingham inputs from patient demographic, latest vitals & lipid lab
  const autoPopulateFramingham = useCallback((patient, vitals = [], labs = []) => {
    if (!patient) return;

    // 1. Age
    if (patient.birth_date) {
      const bDate = new Date(patient.birth_date);
      if (!isNaN(bDate.getTime())) {
        const diffYears = new Date().getFullYear() - bDate.getFullYear();
        setCvdAge(Math.min(85, Math.max(20, diffYears || 45)));
      }
    }

    // 2. Gender
    setCvdGender(patient.gender === 1 || patient.gender === '1' ? '1' : '0');

    // 3. Systolic BP from latest vitals
    if (vitals && vitals.length > 0) {
      const latestWithBp = vitals.find(v => v.systolic_bp);
      if (latestWithBp) {
        setCvdSBP(Number(latestWithBp.systolic_bp));
      }
    }

    // 4. Lipid profile from latest lab test
    if (labs && labs.length > 0) {
      const latestLipid = labs.find(l => (l.test_name || '').toLowerCase().includes('lipid'));
      if (latestLipid && latestLipid.results) {
        if (latestLipid.results.total_chol) setCvdTotalChol(Number(latestLipid.results.total_chol));
        if (latestLipid.results.hdl) setCvdHDL(Number(latestLipid.results.hdl));
      }
    }
  }, []);

  const selectPatientForConsultation = async (patientObj, ticketId = null) => {
    if (!patientObj || !patientObj.id) return;
    setLoadingProfile(true);
    setIsEditingCommon(false);
    setIsEditingAllergies(false);
    setIsEditingMarital(false);
    setIsEditingGender(false);
    setIsEditingPhone(false);
    setIsEditingName(false);
    setIsEditingBirthDate(false);
    setActiveTicketId(ticketId);

    // Reset vitals and labs forms
    setEditingVitalId(null);
    setEditingLabId(null);
    setVitalsForm({
      record_date: getSriLankaTodayString(),
      weight_kg: '',
      height_cm: '',
      systolic_bp: '',
      diastolic_bp: '',
      pulse_bpm: '',
      notes: ''
    });
    setLabForm({
      test_name: selectedCatalogTest || 'FBC',
      test_date: getSriLankaTodayString(),
      results: {},
      remarks: ''
    });

    try {
      const res = await axios.get(`${API_BASE}/patients/${patientObj.id}/consultation`);
      const { patient, allergiesAndReports, prescriptionHistory: history } = res.data;
      setSelectedPatient(patient);
      
      setNameValue(patient.name || '');
      setBirthDateValue(patient.birth_date ? patient.birth_date.substring(0, 10) : '');
      setMaritalValue(patient.married ? patient.married.toString() : '0');
      setGenderValue(patient.gender ? patient.gender.toString() : '1');
      setPhoneValue(patient.phone || '');
      setCommonText(patient.common || '');
      setAllergiesText(allergiesAndReports || '');
      setPrescriptionHistory(history || []);

      // Restore saved prescription draft if doctor was typing
      const savedDraftRx = sessionStorage.getItem(`draft_rx_${patient.id}`);
      const savedDraftRemarks = sessionStorage.getItem(`draft_remarks_${patient.id}`);
      if (savedDraftRx !== null) setPrescriptionText(savedDraftRx);
      else setPrescriptionText('');
      if (savedDraftRemarks !== null) setRemarksText(savedDraftRemarks);
      else setRemarksText('');

      // Fetch dynamic Vitals & Labs concurrently
      const [vitals, labs] = await Promise.all([
        fetchPatientVitals(patient.id),
        fetchPatientInvestigations(patient.id)
      ]);

      // Pre-fill latest height into vitals form if available
      if (vitals && vitals.length > 0 && vitals[0].height_cm) {
        setVitalsForm(prev => ({ ...prev, height_cm: vitals[0].height_cm }));
      }

      // Auto-populate Framingham Risk Score inputs
      autoPopulateFramingham(patient, vitals, labs);

    } catch (err) {
      setSelectedPatient(patientObj);
      setMaritalValue(patientObj.married ? patientObj.married.toString() : '0');
      setGenderValue(patientObj.gender ? patientObj.gender.toString() : '1');
      setPhoneValue(patientObj.phone || '');
      setCommonText(patientObj.common || '');
      setAllergiesText('');
      setPrescriptionHistory([]);
      showToast('Could not fetch complete patient history.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSearchPatients = async (pageToLoad = 1) => {
    const { name, nic, phone, dob } = advancedSearch;
    if (!name.trim() && !nic.trim() && !phone.trim() && !dob) {
      setSearchResults([]); return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`${API_BASE}/patients/search`, { params: { name, nic, phone, dob, page: pageToLoad } });
      if (pageToLoad === 1) setSearchResults(res.data.data || []);
      else setSearchResults(prev => [...prev, ...(res.data.data || [])]);
      setSearchPage(pageToLoad); setHasMoreSearch(res.data.hasMore);
    } catch (err) {
      showToast('Search failed.', 'error');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (sidebarTab !== 'search') return;
    const timer = setTimeout(() => {
      const { name, nic, phone, dob } = advancedSearch;
      if (name.length >= 2 || nic.length >= 2 || phone.length >= 2 || dob) handleSearchPatients(1);
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [advancedSearch, sidebarTab]);

  const handleCreateWalkInPatient = async (e) => {
    e.preventDefault();
    if (!newPatientForm.name.trim()) { showToast('Patient name is required.', 'error'); return; }
    if (!newPatientForm.gender) { showToast('Please select a gender.', 'error'); return; } 

    setCreatingPatient(true);
    try {
      const res = await axios.post(`${API_BASE}/patients`, newPatientForm);
      showToast(`Registered ${res.data.name}.`);
      setNewPatientForm({ name: '', birth_date: '', phone: '', id_number: '', gender: '', married: '0', weight: '', height: '', common: '' });
      await selectPatientForConsultation(res.data, null);
    } catch (err) {
      showToast('Failed to register patient.', 'error');
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleSaveMaritalStatus = async () => {
    if (!selectedPatient) return;
    setSavingMarital(true);
    try {
      await axios.put(`${API_BASE}/patients/${selectedPatient.id}/marital-status`, { married: maritalValue });
      setSelectedPatient(prev => ({ ...prev, married: Number(maritalValue) }));
      setIsEditingMarital(false);
      showToast('Marital status updated successfully.');
    } catch (err) { showToast('Failed to update marital status.', 'error'); } 
    finally { setSavingMarital(false); }
  };

  const handleSaveGender = async () => {
    if (!selectedPatient) return;
    setSavingGender(true);
    try {
      await axios.put(`${API_BASE}/patients/${selectedPatient.id}/gender`, { gender: genderValue });
      setSelectedPatient(prev => ({ ...prev, gender: Number(genderValue) }));
      setIsEditingGender(false);
      setCvdGender(genderValue);
      showToast('Gender updated successfully.');
    } catch (err) { showToast('Failed to update gender.', 'error'); } 
    finally { setSavingGender(false); }
  };

  const handleSavePhone = async () => {
    if (!selectedPatient) return;
    setSavingPhone(true);
    try {
      const cleanPhone = (phoneValue || '').trim();
      await axios.put(`${API_BASE}/patients/${selectedPatient.id}/phone`, { phone: cleanPhone });
      setSelectedPatient(prev => ({ ...prev, phone: cleanPhone }));
      setIsEditingPhone(false);
      showToast('Phone number updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update phone number.', 'error');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveName = async () => {
    if (!selectedPatient) return;
    const cleanName = (nameValue || '').trim();
    if (!cleanName) {
      return showToast('Patient name cannot be empty.', 'error');
    }
    setSavingName(true);
    try {
      await axios.put(`${API_BASE}/patients/${selectedPatient.id}/demographics`, { name: cleanName });
      setSelectedPatient(prev => ({ ...prev, name: cleanName }));
      setQueueList(prev => prev.map(q => q.patient_id === selectedPatient.id ? { ...q, patient: { ...q.patient, name: cleanName } } : q));
      setIsEditingName(false);
      showToast('Patient name updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update patient name.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveBirthDate = async () => {
    if (!selectedPatient) return;
    setSavingBirthDate(true);
    try {
      const cleanDob = birthDateValue ? birthDateValue.trim() : null;
      await axios.put(`${API_BASE}/patients/${selectedPatient.id}/demographics`, { birth_date: cleanDob });
      setSelectedPatient(prev => ({ ...prev, birth_date: cleanDob }));
      setQueueList(prev => prev.map(q => q.patient_id === selectedPatient.id ? { ...q, patient: { ...q.patient, birth_date: cleanDob } } : q));
      setIsEditingBirthDate(false);
      showToast('Date of birth updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update date of birth.', 'error');
    } finally {
      setSavingBirthDate(false);
    }
  };

  const handleSaveCommonDetails = async () => {
    if (!selectedPatient) return;
    setSavingCommon(true);
    try {
      await axios.put(`${API_BASE}/patients/${selectedPatient.id}/common`, { common: commonText });
      setSelectedPatient(prev => ({ ...prev, common: commonText }));
      setIsEditingCommon(false);
      showToast('Common details updated.');
    } catch (err) { showToast('Failed to update details.', 'error'); } 
    finally { setSavingCommon(false); }
  };

  const handleSaveAllergiesReports = async () => {
    if (!selectedPatient || !loggedInDoctor) return;
    setSavingAllergies(true);
    try {
      const res = await axios.put(`${API_BASE}/patients/${selectedPatient.id}/allergies-reports`, { findings_comment: allergiesText, active_ticket_id: activeTicketId, doctor_id: loggedInDoctor.id });
      if (res.data.ticket_id && !activeTicketId) setActiveTicketId(res.data.ticket_id);
      setIsEditingAllergies(false);
      showToast('Allergies and reports updated.');
    } catch (err) { showToast('Failed to update allergies.', 'error'); } 
    finally { setSavingAllergies(false); }
  };

  const handleSubmitPrescription = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient || !loggedInDoctor) return showToast('Please select a patient first.', 'error');
    if (!prescriptionText.trim()) return showToast('Please enter a prescription.', 'error');
    
    setSubmittingRx(true);
    try {
      await axios.post(`${API_BASE}/doctor/prescribe`, {
        patient_id: selectedPatient.id, ticket_id: activeTicketId, general: prescriptionText, reason_remarks: remarksText, doctor_id: loggedInDoctor.id, doctor_name: loggedInDoctor.name, patient_name: selectedPatient.name
      });
      showToast(`Prescription sent to Counter for ${selectedPatient.name}.`);
      
      // Clear drafts for this patient
      sessionStorage.removeItem(`draft_rx_${selectedPatient.id}`);
      sessionStorage.removeItem(`draft_remarks_${selectedPatient.id}`);
      sessionStorage.removeItem('draft_rx_general');

      setPrescriptionText(''); setRemarksText('');
      
      // Reset screen to empty state
      setSelectedPatient(null);
      setActiveTicketId(null);
      setCommonText('');
      setAllergiesText('');
      setPrescriptionHistory([]);
      setPatientVitalsList([]);
      setPatientLabList([]);

      await fetchQueue();
    } catch (err) {
      showToast('Failed to submit prescription.', 'error');
    } finally {
      setSubmittingRx(false);
    }
  };

  const handleRingCounterBell = async () => {
    if (!loggedInDoctor || bellCooldown) return;
    setBellCooldown(true);
    try {
      await axios.post(`${API_BASE}/doctor/bell`, { doctor_id: loggedInDoctor.id, doctor_name: loggedInDoctor.name });
      showToast('Counter bell rung!');
    } catch (err) {
      showToast('Failed to ring counter bell.', 'error');
    } finally {
      setTimeout(() => setBellCooldown(false), 3000);
    }
  };

  // -------------------------------------------------------------
  // VITALS CRUD HANDLERS
  // -------------------------------------------------------------
  const handleSaveVitals = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) return showToast('Please select a patient first.', 'error');

    if (!vitalsForm.weight_kg && !vitalsForm.height_cm && !vitalsForm.systolic_bp && !vitalsForm.notes) {
      return showToast('Please enter at least Weight, Height, or Blood Pressure.', 'error');
    }

    setSavingVitals(true);
    try {
      if (editingVitalId) {
        await axios.put(`${API_BASE}/doctor/vitals/${editingVitalId}`, vitalsForm);
        showToast('Vitals record updated.');
      } else {
        await axios.post(`${API_BASE}/doctor/patients/${selectedPatient.id}/vitals`, vitalsForm);
        showToast('Vitals recorded successfully.');
      }

      setEditingVitalId(null);
      const updatedVitals = await fetchPatientVitals(selectedPatient.id);
      
      // Keep height populated for convenience, clear weight & BP
      setVitalsForm(prev => ({
        record_date: getSriLankaTodayString(),
        weight_kg: '',
        height_cm: prev.height_cm || '',
        systolic_bp: '',
        diastolic_bp: '',
        pulse_bpm: '',
        notes: ''
      }));

      // Update Framingham BP if systolic present
      if (vitalsForm.systolic_bp) {
        setCvdSBP(Number(vitalsForm.systolic_bp));
      }

    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save vitals record.', 'error');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleEditVital = (vital) => {
    setEditingVitalId(vital.id);
    setVitalsForm({
      record_date: vital.record_date ? vital.record_date.substring(0, 10) : getSriLankaTodayString(),
      weight_kg: vital.weight_kg || '',
      height_cm: vital.height_cm || '',
      systolic_bp: vital.systolic_bp || '',
      diastolic_bp: vital.diastolic_bp || '',
      pulse_bpm: vital.pulse_bpm || '',
      notes: vital.notes || ''
    });
    setDocDiagnosticTab('vitals');
  };

  const handleCancelEditVital = () => {
    setEditingVitalId(null);
    setVitalsForm({
      record_date: getSriLankaTodayString(),
      weight_kg: '',
      height_cm: patientVitalsList[0]?.height_cm || '',
      systolic_bp: '',
      diastolic_bp: '',
      pulse_bpm: '',
      notes: ''
    });
  };

  const handleDeleteVital = async (vitalId) => {
    if (!window.confirm('Are you sure you want to delete this vitals entry?')) return;
    try {
      await axios.delete(`${API_BASE}/doctor/vitals/${vitalId}`);
      showToast('Vitals entry deleted.');
      if (editingVitalId === vitalId) handleCancelEditVital();
      if (selectedPatient) fetchPatientVitals(selectedPatient.id);
    } catch (err) {
      showToast('Failed to delete vitals record.', 'error');
    }
  };

  // -------------------------------------------------------------
  // LAB INVESTIGATIONS CRUD HANDLERS
  // -------------------------------------------------------------
  const handleSelectTest = (testName) => {
    setSelectedCatalogTest(testName);
    setSelectedLabMetricToGraph('all');
    setLabForm(prev => ({
      ...prev,
      test_name: testName,
      // Clear fields if not currently editing
      results: editingLabId ? prev.results : {},
      remarks: editingLabId ? prev.remarks : ''
    }));
  };

  const handleLabResultChange = (fieldKey, value) => {
    setLabForm(prev => ({
      ...prev,
      results: {
        ...prev.results,
        [fieldKey]: value
      }
    }));
  };

  const handleSaveLabResult = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) return showToast('Please select a patient first.', 'error');

    // Find investigation_id from catalog
    const matchedCatalog = investigationCatalog.find(
      c => c.investigation?.toLowerCase() === (selectedCatalogTest || '').toLowerCase()
    );

    const payload = {
      investigation_id: matchedCatalog ? matchedCatalog.id : null,
      test_name: selectedCatalogTest,
      test_date: labForm.test_date || getSriLankaTodayString(),
      results: labForm.results,
      remarks: labForm.remarks
    };

    setSavingLab(true);
    try {
      if (editingLabId) {
        await axios.put(`${API_BASE}/doctor/investigations/${editingLabId}`, payload);
        showToast(`Updated ${selectedCatalogTest} record.`);
      } else {
        await axios.post(`${API_BASE}/doctor/patients/${selectedPatient.id}/investigations`, payload);
        showToast(`Saved ${selectedCatalogTest} record.`);
      }

      setEditingLabId(null);
      const updatedLabs = await fetchPatientInvestigations(selectedPatient.id);
      
      // Reset results
      setLabForm(prev => ({
        test_name: selectedCatalogTest,
        test_date: getSriLankaTodayString(),
        results: {},
        remarks: ''
      }));

      // Update Framingham if Lipid Profile was saved
      if (selectedCatalogTest === 'Lipid Profile' && payload.results) {
        if (payload.results.total_chol) setCvdTotalChol(Number(payload.results.total_chol));
        if (payload.results.hdl) setCvdHDL(Number(payload.results.hdl));
      }

    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save lab investigation.', 'error');
    } finally {
      setSavingLab(false);
    }
  };

  const handleEditLabResult = (labRecord) => {
    setEditingLabId(labRecord.id);
    setSelectedCatalogTest(labRecord.test_name);
    setSelectedLabMetricToGraph('all');
    setLabForm({
      test_name: labRecord.test_name,
      test_date: labRecord.test_date ? labRecord.test_date.substring(0, 10) : getSriLankaTodayString(),
      results: labRecord.results || {},
      remarks: labRecord.remarks || ''
    });
    setDocDiagnosticTab('labs');
  };

  const handleCancelEditLab = () => {
    setEditingLabId(null);
    setLabForm({
      test_name: selectedCatalogTest,
      test_date: getSriLankaTodayString(),
      results: {},
      remarks: ''
    });
  };

  const handleDeleteLabResult = async (invId) => {
    if (!window.confirm('Are you sure you want to delete this lab report?')) return;
    try {
      await axios.delete(`${API_BASE}/doctor/investigations/${invId}`);
      showToast('Lab report deleted.');
      if (editingLabId === invId) handleCancelEditLab();
      if (selectedPatient) fetchPatientInvestigations(selectedPatient.id);
    } catch (err) {
      showToast('Failed to delete lab report.', 'error');
    }
  };

  // -------------------------------------------------------------
  // COMPUTED METRICS & CHART DATA
  // -------------------------------------------------------------

  // Real-time BMI metrics based on latest form inputs or latest saved vital
  const latestBmiMetrics = useMemo(() => {
    const currentWeight = vitalsForm.weight_kg || patientVitalsList[0]?.weight_kg;
    const currentHeight = vitalsForm.height_cm || patientVitalsList[0]?.height_cm;
    return calculateBmiAndTargetWeight(currentWeight, currentHeight);
  }, [vitalsForm.weight_kg, vitalsForm.height_cm, patientVitalsList]);

  // Vitals Chronological Chart Data (strictly sorted oldest on LEFT, newest on RIGHT)
  const vitalsChartData = useMemo(() => {
    return [...patientVitalsList]
      .sort((a, b) => (new Date(a.record_date) - new Date(b.record_date)) || ((a.id || 0) - (b.id || 0)))
      .map(v => ({
        date: formatClearDate(v.record_date),
        rawDate: v.record_date,
        weight: v.weight_kg ? Number(v.weight_kg) : null,
        bmi: v.bmi ? Number(v.bmi) : null,
        systolic: v.systolic_bp ? Number(v.systolic_bp) : null,
        diastolic: v.diastolic_bp ? Number(v.diastolic_bp) : null,
        pulse: v.pulse_bpm ? Number(v.pulse_bpm) : null
      }));
  }, [patientVitalsList]);

  // Lab Chronological Chart Data for selected test (strictly sorted oldest on LEFT, newest on RIGHT)
  const filteredLabRecordsForGraph = useMemo(() => {
    if (!selectedCatalogTest) return [];
    return [...patientLabList]
      .filter(l => {
        const t1 = (l.test_name || '').toLowerCase();
        const t2 = selectedCatalogTest.toLowerCase();
        if (t1 === t2) return true;
        if ((t1.includes('thirox') || t1.includes('thyrox')) && (t2.includes('thirox') || t2.includes('thyrox'))) return true;
        return false;
      })
      .sort((a, b) => (new Date(a.test_date) - new Date(b.test_date)) || ((a.id || 0) - (b.id || 0)))
      .map(l => {
        const item = {
          date: formatClearDate(l.test_date),
          rawDate: l.test_date,
          id: l.id
        };
        if (l.results && typeof l.results === 'object') {
          Object.keys(l.results).forEach(k => {
            const num = parseFloat(l.results[k]);
            item[k] = !isNaN(num) ? num : l.results[k];
          });
        }
        return item;
      });
  }, [patientLabList, selectedCatalogTest]);

  // Calculated Framingham CVD Risk Result
  const cvdResult = useMemo(() => {
    return calculateFraminghamCvd({
      age: cvdAge,
      gender: cvdGender,
      totalChol: cvdTotalChol,
      hdl: cvdHDL,
      sbp: cvdSBP,
      isTreated: cvdIsTreated,
      isSmoker: cvdIsSmoker,
      isDiabetic: cvdIsDiabetic
    });
  }, [cvdAge, cvdGender, cvdTotalChol, cvdHDL, cvdSBP, cvdIsTreated, cvdIsSmoker, cvdIsDiabetic]);

  const handleAutoFillFramingham = () => {
    if (selectedPatient) {
      autoPopulateFramingham(selectedPatient, patientVitalsList, patientLabList);
      showToast('Re-synced CVD metrics from latest vitals and lab results.');
    }
  };

  return {
    activeTheme, setActiveTheme, loggedInDoctor, loginUsername, setLoginUsername, loginPassword, setLoginPassword, loginError, loggingIn,
    handleDoctorLogin, handleDoctorLogout, sidebarTab, setSidebarTab, queueList, loadingQueue, fetchQueue,
    advancedSearch, setAdvancedSearch, searchResults, searchPage, hasMoreSearch, searching, handleSearchPatients, 
    newPatientForm, setNewPatientForm, creatingPatient, handleCreateWalkInPatient, selectedPatient, activeTicketId, loadingProfile, 
    selectPatientForConsultation, 
    isEditingName, setIsEditingName, nameValue, setNameValue, savingName, handleSaveName,
    isEditingBirthDate, setIsEditingBirthDate, birthDateValue, setBirthDateValue, savingBirthDate, handleSaveBirthDate,
    isEditingMarital, setIsEditingMarital, maritalValue, setMaritalValue, savingMarital, handleSaveMaritalStatus,
    isEditingGender, setIsEditingGender, genderValue, setGenderValue, savingGender, handleSaveGender,
    isEditingPhone, setIsEditingPhone, phoneValue, setPhoneValue, savingPhone, handleSavePhone,
    commonText, setCommonText, isEditingCommon, setIsEditingCommon, savingCommon, handleSaveCommonDetails, 
    allergiesText, setAllergiesText, isEditingAllergies, setIsEditingAllergies, savingAllergies, handleSaveAllergiesReports, 
    prescriptionText, setPrescriptionText, remarksText, setRemarksText, submittingRx, handleSubmitPrescription, prescriptionHistory, 
    bellCooldown, handleRingCounterBell, statusBanner,

    // Diagnostic Hub Analytics
    docDiagnosticTab, setDocDiagnosticTab,
    // Vitals
    patientVitalsList, loadingVitals, vitalsForm, setVitalsForm, editingVitalId, savingVitals,
    handleSaveVitals, handleEditVital, handleCancelEditVital, handleDeleteVital,
    latestBmiMetrics, vitalsChartData,
    // Labs
    investigationCatalog, selectedCatalogTest, setSelectedCatalogTest, fetchInvestigationCatalog,
    patientLabList, loadingLabs, labForm, setLabForm, editingLabId, savingLab,
    selectedLabMetricToGraph, setSelectedLabMetricToGraph,
    handleSelectTest, handleLabResultChange, handleSaveLabResult, handleEditLabResult, handleCancelEditLab, handleDeleteLabResult,
    filteredLabRecordsForGraph,
    // Framingham CVD
    cvdAge, setCvdAge, cvdGender, setCvdGender, cvdTotalChol, setCvdTotalChol, cvdHDL, setCvdHDL,
    cvdSBP, setCvdSBP, cvdIsTreated, setCvdIsTreated, cvdIsSmoker, setCvdIsSmoker, cvdIsDiabetic, setCvdIsDiabetic,
    cvdResult, handleAutoFillFramingham
  };
}
