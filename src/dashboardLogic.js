import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

// High-trust, professional clinical & dispensary photography
export const SLIDER_IMAGES = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1920&q=80'
];

export function useDashboardLogic() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Staff Clinical Status
  const [doctorOnline, setDoctorOnline] = useState(true);
  const [counterOnline] = useState(true);

  // Clinic Practice Telemetry
  const [telemetry, setTelemetry] = useState({
    activeQueue: 0,
    servedToday: 0,
    roomStatus: 'Doctor In Attendance'
  });

  // 1. Live clinic metrics polling
  useEffect(() => {
    let isMounted = true;

    const fetchTelemetry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/system/public-stats`);
        if (!isMounted) return;

        const isDocOnline = !!res.data.isDoctorOnline;
        setDoctorOnline(isDocOnline);
        setTelemetry({
          activeQueue: res.data.queueCount || 0,
          servedToday: res.data.dispensedToday || 0,
          roomStatus: isDocOnline ? 'Doctor In Attendance' : 'Doctor On Call'
        });
      } catch (err) {
        // Fallback gracefully without breaking UI
        if (isMounted) {
          setTelemetry((prev) => ({
            ...prev,
            roomStatus: 'Doctor In Attendance'
          }));
        }
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Dignified, smooth background slider transitions (every 7 seconds)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 7000);
    return () => clearInterval(slideTimer);
  }, []);

  // 3. Passive scroll listener for subtle parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Clinic Clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Subtle scroll styling for hero section
  const heroOpacity = Math.max(0.1, 1 - scrollY / 600);
  const heroTranslateY = scrollY * 0.22;

  // Trigger modules visibility
  const tilesVisible = scrollY > 60;

  return {
    currentSlide,
    setCurrentSlide,
    currentTime,
    doctorOnline,
    counterOnline,
    telemetry,
    heroStyle: {
      opacity: heroOpacity,
      transform: `translateY(${heroTranslateY}px)`
    },
    tilesVisible
  };
}
