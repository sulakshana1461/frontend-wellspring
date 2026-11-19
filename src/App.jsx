import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SLIDER_IMAGES, useDashboardLogic } from './dashboardLogic';
import './App.css';
import DoctorPortal from './DoctorPortal';
import CounterPortal from './CounterPortal';
import AdminPortal from './AdminPortal';
import GRNPortal from './GRNPortal';
import QueueDisplay from './QueueDisplay';

// Top Navigation Bar (Clean Light Medical Theme)
const TopNavbar = ({ currentTime, doctorOnline, counterOnline }) => (
  <header className="top-navbar">
    <Link to="/" className="nav-brand">
      <div className="brand-cross">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </div>
      <div className="brand-text-col">
        <span className="brand-name">Wellspring Health Care</span>
        <span className="brand-sub">Private Clinic &amp; Dispensary</span>
      </div>
    </Link>

    <nav className="nav-links">
      <a href="#hero" className="nav-item">Home</a>
      <a href="#modules" className="nav-item">Terminals</a>
      <Link to="/queue" className="nav-item">Queue</Link>
      <a href="#about" className="nav-item">About</a>
      <a href="#contact" className="nav-item">Contact Us</a>
    </nav>

    <div className="nav-telemetry">
      <div className="staff-status-group">
        <div className="staff-badge" title="Physician consultation availability">
          <span className={`status-dot ${doctorOnline ? 'online' : 'standby'}`}></span>
          <span className="staff-label">Doctor:</span>
          <span className="staff-val">{doctorOnline ? 'In Attendance' : 'On Call'}</span>
        </div>
        <div className="staff-badge" title="Dispensary and reception status">
          <span className={`status-dot ${counterOnline ? 'online' : 'standby'}`}></span>
          <span className="staff-label">Dispensary:</span>
          <span className="staff-val">{counterOnline ? 'Open' : 'Standby'}</span>
        </div>
      </div>

      <div className="clock-display" title="Clinic Time">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', opacity: 0.7 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  </header>
);

// Main Front Page
const HomePage = () => {
  const {
    currentSlide,
    setCurrentSlide,
    currentTime,
    doctorOnline,
    counterOnline,
    telemetry,
    heroStyle,
    tilesVisible
  } = useDashboardLogic();

  return (
    <div className="homepage-wrapper">
      <TopNavbar currentTime={currentTime} doctorOnline={doctorOnline} counterOnline={counterOnline} />

      {/* ================= HERO SECTION ================= */}
      <section id="hero" className="hero-section">
        {/* Soft Clinical Architectural Photography Slider */}
        {SLIDER_IMAGES.map((imgUrl, index) => (
          <div
            key={index}
            className={`slider-bg ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${imgUrl})` }}
          />
        ))}
        <div className="hero-overlay"></div>

        <div className="hero-content" style={heroStyle}>
          <div className="medical-pill-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
            <span>Private Medical Practice &amp; In-House Dispensary</span>
          </div>

          {/* Deep Medical Blue applied to Wellspring title (Tangerine Font Preserved) */}
          <h1 className="wellspring-title">Wellspring</h1>
          <p className="healthcare-subtitle">HEALTH CARE CENTER</p>

          <p className="hero-mission-statement">
            Personalized primary medical care, dedicated physician consultations, and direct pharmacy dispensing under one roof.
          </p>

          {/* Elegant Clinical Practice Plaque (Status Overview) */}
          <div className="clinic-status-plaque">
            <div className="plaque-item">
              <div className="plaque-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="plaque-details">
                <span className="plaque-label">Patient Waiting Queue</span>
                <span className="plaque-value">
                  <span className="live-dot"></span>
                  {telemetry.activeQueue} Waiting
                </span>
              </div>
            </div>

            <div className="plaque-divider"></div>

            <div className="plaque-item">
              <div className="plaque-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="plaque-details">
                <span className="plaque-label">Consultation Room</span>
                <span className="plaque-value">{telemetry.roomStatus}</span>
              </div>
            </div>

            <div className="plaque-divider"></div>

            <div className="plaque-item">
              <div className="plaque-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="plaque-details">
                <span className="plaque-label">Dispensary Activity</span>
                <span className="plaque-value">{telemetry.servedToday} Dispensed Today</span>
              </div>
            </div>

            <div className="plaque-divider"></div>

            <div className="plaque-item">
              <div className="plaque-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="plaque-details">
                <span className="plaque-label">Daily Sessions</span>
                <span className="plaque-value">7–8 AM &amp; 5:30–8:30 PM</span>
              </div>
            </div>
          </div>

          {/* Minimalist Slider Indicators */}
          <div className="slider-indicators">
            {SLIDER_IMAGES.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <a href="#modules" className="scroll-prompt" aria-label="Scroll to clinical terminals">
          <span>Clinical Workstations</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        </a>
      </section>

      {/* ================= 4 CLINICAL WORKSTATIONS (PRESERVED IN BLUE) ================= */}
      <section id="modules" className="modules-section">
        <div className={`section-header ${tilesVisible ? 'visible' : ''}`}>
          <div className="section-eyebrow">PRACTICE MANAGEMENT</div>
          <h2>Clinical Workstations &amp; Portals</h2>
          <p>Authorized access points for medical consultation, dispensary counter, inventory intake, and administration.</p>
        </div>

        <div className="tiles-grid">
          {/* 1. DOCTOR SUITE */}
          <Link to="/doctor" className={`module-tile ${tilesVisible ? 'slide-in' : ''}`}>
            <div className="tile-accent-line"></div>
            <div className="tile-top-row">
              <div className="tile-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
              </div>
              <span className="tile-badge">Physician Suite</span>
            </div>
            <h3 className="tile-title">Doctor Consultation</h3>
            <p className="tile-desc">
              Patient examinations, diagnostic records, allergy alerts, past visit histories, and instant digital prescriptions.
            </p>
            <div className="tile-footer">
              <span>Launch Consultation</span>
              <span className="arrow">→</span>
            </div>
          </Link>

          {/* 2. DISPENSARY COUNTER */}
          <Link to="/counter" className={`module-tile ${tilesVisible ? 'slide-in' : ''}`}>
            <div className="tile-accent-line"></div>
            <div className="tile-top-row">
              <div className="tile-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="tile-badge">Dispensary Desk</span>
            </div>
            <h3 className="tile-title">Counter &amp; Pharmacy</h3>
            <p className="tile-desc">
              Walk-in patient registration, ticketing queue control, multi-tab prescription dispensing, and POS billing.
            </p>
            <div className="tile-footer">
              <span>Launch Counter</span>
              <span className="arrow">→</span>
            </div>
          </Link>

          {/* 3. STOCK & GRN */}
          <Link to="/grn" className={`module-tile ${tilesVisible ? 'slide-in' : ''}`}>
            <div className="tile-accent-line"></div>
            <div className="tile-top-row">
              <div className="tile-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>
              <span className="tile-badge">Pharmaceutical Stock</span>
            </div>
            <h3 className="tile-title">Stock &amp; GRN</h3>
            <p className="tile-desc">
              Goods Received Notes, batch intake verification, manufacturer expiry tracking, and medicine master cataloging.
            </p>
            <div className="tile-footer">
              <span>Launch Inventory</span>
              <span className="arrow">→</span>
            </div>
          </Link>

          {/* 4. PRACTICE ADMIN */}
          <Link to="/admin" className={`module-tile ${tilesVisible ? 'slide-in' : ''}`}>
            <div className="tile-accent-line"></div>
            <div className="tile-top-row">
              <div className="tile-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span className="tile-badge">Governance &amp; Audit</span>
            </div>
            <h3 className="tile-title">Administration</h3>
            <p className="tile-desc">
              Practice revenue analytics, daily financial logs, patient demographic reports, and clinical staff credentials.
            </p>
            <div className="tile-footer">
              <span>Launch Admin</span>
              <span className="arrow">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ================= ABOUT THE PRACTICE ================= */}
      <section id="about" className="info-section">
        <div className="info-container">
          <div className="section-header visible">
            <div className="section-eyebrow">ABOUT WELLSPRING</div>
            <h2>Private Clinical Care &amp; Dedicated Dispensary</h2>
            <p>Built upon the standard of traditional family medicine combined with streamlined modern dispensary operations.</p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <div className="about-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h3>Patient-Centered Practice</h3>
              <p>
                Every consultation is conducted with thorough clinical attention. We maintain comprehensive longitudinal medical records to ensure consistent care across every visit.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Direct On-Site Dispensary</h3>
              <p>
                Prescribed medications are dispensed directly by dispensary staff immediately following the consultation, ensuring pharmaceutical authenticity and precise dosage guidance.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Real-Time Queue Transparency</h3>
              <p>
                Patients receive immediate sequential queue tokens upon arrival. Live waiting room displays keep patient flow orderly, calm, and free of unnecessary waiting anxiety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRACTICE CONTACT & REAL CLINIC DETAILS ================= */}
      <section id="contact" className="info-section alt-bg">
        <div className="info-container">
          <div className="section-header visible">
            <div className="section-eyebrow">VISIT &amp; CONNECT</div>
            <h2>Practice Information &amp; Hours</h2>
            <p>Conveniently located for direct patient consultations, prescription refills, and clinical inquiries.</p>
          </div>

          <div className="contact-grid">
            {/* 1. CLINIC LOCATION WITH GOOGLE MAPS LINK */}
            <div className="contact-card">
              <div className="contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h4>Dispensary Location</h4>
              <p className="contact-bold">Wellspring Health Care Center</p>
              <p className="dim location-address">9V2P+WV8, Deeparama Mawatha, Kirimatiyana Junction.</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Wellspring+Health+Care+Center,+9V2P%2BWV8,+Deeparama+Mawatha,+Kirimatiyana+Junction"
                target="_blank"
                rel="noopener noreferrer"
                className="map-action-link"
              >
                <span>Open in Google Maps</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            {/* 2. REAL CONSULTATION & OPENING TIMES */}
            <div className="contact-card">
              <div className="contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h4>Opening &amp; Clinic Times</h4>
              <div className="hours-block">
                <span className="hours-label">Monday – Saturday:</span>
                <span className="hours-time">7:00 AM – 8:00 AM</span>
                <span className="hours-time">5:30 PM – 8:30 PM</span>
              </div>
              <div className="hours-block" style={{ marginTop: '8px' }}>
                <span className="hours-label">Sunday Sessions:</span>
                <span className="hours-time">7:00 AM – 10:00 AM</span>
                <span className="hours-time">5:30 PM – 8:30 PM (Evening)</span>
              </div>
            </div>

            {/* 3. REAL DISPENSARY PHONE NUMBER */}
            <div className="contact-card">
              <div className="contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h4>Dispensary &amp; Telephone</h4>
              <a href="tel:+94714347804" className="phone-number-link">
                +94 71 4347804
              </a>
              <p className="dim" style={{ marginTop: '6px' }}>Direct phone line for patient inquiries, doctor appointments &amp; medication stock.</p>
            </div>

            {/* 4. WAITING ROOM DISPLAY TV SHORTCUT */}
            <div className="contact-card highlight">
              <div className="contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h4>Waiting Room Display</h4>
              <p>Dedicated live sequential TV view for patient waiting lounges.</p>
              <Link to="/queue" className="queue-quick-link">
                Open Queue Display →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= REFINED CLINICAL FOOTER ================= */}
      <footer className="clinical-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-title">Wellspring Health Care</span>
            <span className="footer-subtitle">Private Dispensary &amp; Primary Care Center</span>
          </div>
          <div className="footer-meta">
            <p>© {new Date().getFullYear()} Wellspring Health Care. All rights reserved.</p>
            <p className="compliance-note">Confidential clinical system. Patient records strictly encrypted &amp; protected.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/doctor" element={<DoctorPortal />} />
        <Route path="/counter" element={<CounterPortal />} />
        <Route path="/grn" element={<GRNPortal />} />
        <Route path="/queue" element={<QueueDisplay />} />
      </Routes>
    </Router>
  );
}
