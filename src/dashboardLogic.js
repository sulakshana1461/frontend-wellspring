import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

export function useDashboardLogic() {
  const [scrollY, setScrollY] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Staff Clinical Status
  const [doctorOnline, setDoctorOnline] = useState(true);
  const [counterOnline, setCounterOnline] = useState(true);

  // 1. Live clinic metrics polling for online indicator
  useEffect(() => {
    let isMounted = true;

    const fetchTelemetry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/system/public-stats`);
        if (!isMounted) return;
        setDoctorOnline(!!res.data.isDoctorOnline);
      } catch (err) {
        // Fallback gracefully without breaking UI
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Passive scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Clinic Clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Reveal module tiles smoothly
  const tilesVisible = scrollY > 20 || true; // Always visible or softly activated

  return {
    currentTime,
    doctorOnline,
    counterOnline,
    tilesVisible
  };
}
