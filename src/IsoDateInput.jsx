import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MONTH_FULL_NAMES,
  buildIsoDate,
  calculateAge,
  daysInMonth,
  formatClearDate,
  getSriLankaTodayString,
  normalizeLooseIsoOnBlur,
  parseStrictIsoDate,
  validateIsoDateInput
} from './dateUtils';
import './IsoDateInput.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Locale-independent ISO 8601 (YYYY-MM-DD) Date Input with a custom Portal Calendar Picker.
 * Eliminates browser OS mm/dd/yyyy rendering and prevents MM/DD swaps completely.
 */
export default function IsoDateInput({
  value = '',
  onChange,
  placeholder = 'YYYY-MM-DD',
  className = '',
  style = {},
  required = false,
  disabled = false,
  autoFocus = false,
  minDate = '1900-01-01',
  maxDate = null,
  theme = 'light',
  inline = false,
  showPreview = false,
  showAge = false,
  onKeyDown,
  title
}) {
  const todayIso = getSriLankaTodayString();
  const todayParts = parseStrictIsoDate(todayIso);

  const [isOpen, setIsOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const initialParsed = parseStrictIsoDate(value);
  const [viewYear, setViewYear] = useState(initialParsed?.year || todayParts?.year || 2026);
  const [viewMonth, setViewMonth] = useState(initialParsed?.month || todayParts?.month || 1);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  const minYear = useMemo(() => {
    const parsedMin = parseStrictIsoDate(minDate);
    return parsedMin ? parsedMin.year : 1900;
  }, [minDate]);

  const maxYear = useMemo(() => {
    const parsedMax = parseStrictIsoDate(maxDate);
    if (parsedMax) return parsedMax.year;
    return Math.max((todayParts?.year || 2026) + 5, 2035);
  }, [maxDate, todayParts]);

  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Keep calendar view synced when opening or when a valid value changes externally
  useEffect(() => {
    const parsed = parseStrictIsoDate(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  const updatePopoverPosition = () => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const popWidth = 296;
    const popHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < popHeight && rect.top > popHeight;

    const top = openAbove
      ? Math.max(8, rect.top - popHeight - 6)
      : Math.min(window.innerHeight - popHeight - 8, rect.bottom + 6);

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popWidth - 8));
    setPopoverPos({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();

    const handleOutsideClick = (e) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleWindowResizeOrScroll = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      updatePopoverPosition();
    };

    const handleGlobalKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('resize', handleWindowResizeOrScroll);
    window.addEventListener('scroll', handleWindowResizeOrScroll, true);
    document.addEventListener('keydown', handleGlobalKey);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', handleWindowResizeOrScroll);
      window.removeEventListener('scroll', handleWindowResizeOrScroll, true);
      document.removeEventListener('keydown', handleGlobalKey);
    };
  }, [isOpen]);

  const handleOpenCalendar = () => {
    if (disabled) return;
    const parsed = parseStrictIsoDate(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    } else if (todayParts) {
      const clampedYear = Math.min(maxYear, Math.max(minYear, todayParts.year));
      setViewYear(clampedYear);
      setViewMonth(todayParts.month);
    }
    setIsOpen((prev) => !prev);
  };

  const handleTextChange = (e) => {
    const prev = typeof value === 'string' ? value : '';
    let next = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Normalize slashes/dots to hyphens and strip invalid characters
    next = next.replace(/[./]/g, '-').replace(/[^\d-]/g, '').replace(/-{2,}/g, '-');

    // If user pasted 8 raw digits like 19950514, auto-format cleanly
    if (/^\d{8}$/.test(next)) {
      next = `${next.slice(0, 4)}-${next.slice(4, 6)}-${next.slice(6, 8)}`;
    } else if (
      next.length > prev.length &&
      cursorPos === e.target.value.length
    ) {
      // Only auto-insert hyphen when typing forward at the end of the string
      if (/^\d{4}$/.test(next) || /^\d{4}-\d{2}$/.test(next)) {
        next = `${next}-`;
      }
    }

    if (next.length > 10) {
      next = next.slice(0, 10);
    }

    if (onChange) onChange(next);
  };

  const handleBlur = () => {
    setTouched(true);
    if (typeof value === 'string' && value.trim()) {
      const normalized = normalizeLooseIsoOnBlur(value);
      if (normalized !== value && onChange) {
        onChange(normalized);
      }
    }
  };

  const handleSelectDay = (day) => {
    const iso = buildIsoDate(viewYear, viewMonth, day);
    if (maxDate && iso > maxDate) return;
    if (minDate && iso < minDate) return;
    setTouched(true);
    if (onChange) onChange(iso);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > minYear) {
        setViewYear((y) => y - 1);
        setViewMonth(12);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < maxYear) {
        setViewYear((y) => y + 1);
        setViewMonth(1);
      }
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleKeyDownInternal = (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
      return;
    }
    if (onKeyDown) onKeyDown(e);
  };

  // Validation state for live inline feedback
  const validation = useMemo(
    () => validateIsoDateInput(value, { required, minDate, maxDate }),
    [value, required, minDate, maxDate]
  );

  const parsedValue = useMemo(() => parseStrictIsoDate(value), [value]);

  // Show immediate error if format is clearly invalid (e.g. MM-DD-YYYY, bad month > 12, full 10 chars invalid) or after blur
  const hasImmediatePatternError =
    typeof value === 'string' &&
    value.trim().length > 0 &&
    (/^\d{1,2}[-/.]\d{1,2}[-/.]/.test(value.trim()) ||
      /^\d{4}-(1[3-9]|[2-9]\d|00)/.test(value.trim()) ||
      value.trim().length >= 10);

  const showError = !validation.valid && (touched || hasImmediatePatternError);

  // Calendar day matrix for current viewYear + viewMonth
  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay(); // 0=Sun..6=Sat
    const totalDays = daysInMonth(viewYear, viewMonth);
    const cells = [];

    for (let i = 0; i < firstDayWeekday; i += 1) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d += 1) {
      cells.push(d);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const inputStyle = { ...style };
  const containerStyle = {};
  if (inputStyle.marginBottom !== undefined) {
    containerStyle.marginBottom = inputStyle.marginBottom;
    inputStyle.marginBottom = 0;
  }

  return (
    <div
      className={`iso-date-container ${inline ? 'iso-date-inline' : ''} ${theme === 'dark' ? 'iso-theme-dark' : ''}`}
      style={containerStyle}
    >
      <div className="iso-date-input-wrap" ref={wrapRef}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={10}
          className={`${className} iso-date-text-input ${showError ? 'iso-date-invalid' : ''}`.trim()}
          style={inputStyle}
          value={value || ''}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDownInternal}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          title={title || 'Format: YYYY-MM-DD (e.g. 1995-05-14)'}
          autoComplete="off"
        />
        <button
          type="button"
          className="iso-date-calendar-btn"
          onClick={handleOpenCalendar}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Open calendar picker"
          title="Select from calendar (YYYY-MM-DD)"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {showError && (
        <div className="iso-date-feedback error">{validation.error}</div>
      )}

      {!showError && showPreview && parsedValue && (
        <div className="iso-date-feedback preview">
          ✓ {formatClearDate(parsedValue.iso)}
          {showAge ? ` • ${calculateAge(parsedValue.iso)}` : ''}
        </div>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={`iso-calendar-popover ${theme === 'dark' ? 'dark' : ''}`}
            style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="iso-cal-header">
              <button
                type="button"
                className="iso-cal-nav-btn"
                onClick={handlePrevMonth}
                title="Previous month"
              >
                ‹
              </button>

              <div className="iso-cal-selects">
                <select
                  className="iso-cal-select month"
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label="Select month"
                >
                  {MONTH_FULL_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {String(idx + 1).padStart(2, '0')} - {name.slice(0, 3)}
                    </option>
                  ))}
                </select>

                <select
                  className="iso-cal-select year"
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label="Select year"
                >
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="iso-cal-nav-btn"
                onClick={handleNextMonth}
                title="Next month"
              >
                ›
              </button>
            </div>

            <div className="iso-cal-weekdays">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="iso-cal-weekday">
                  {wd}
                </div>
              ))}
            </div>

            <div className="iso-cal-grid">
              {calendarCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const cellIso = buildIsoDate(viewYear, viewMonth, day);
                const isSelected = parsedValue?.iso === cellIso;
                const isToday = todayIso === cellIso;
                const isDisabled =
                  (maxDate && cellIso > maxDate) || (minDate && cellIso < minDate);

                return (
                  <button
                    key={cellIso}
                    type="button"
                    disabled={isDisabled}
                    className={`iso-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`.trim()}
                    onClick={() => handleSelectDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="iso-cal-footer">
              <button
                type="button"
                className="iso-cal-footer-btn clear"
                onClick={() => {
                  setTouched(false);
                  if (onChange) onChange('');
                  setIsOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="iso-cal-footer-btn"
                disabled={(maxDate && todayIso > maxDate) || (minDate && todayIso < minDate)}
                onClick={() => {
                  if (todayParts) {
                    setViewYear(todayParts.year);
                    setViewMonth(todayParts.month);
                  }
                  setTouched(true);
                  if (onChange) onChange(todayIso);
                  setIsOpen(false);
                }}
              >
                Today ({todayIso})
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
