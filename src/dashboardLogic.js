import { useState, useEffect } from 'react';

export function useDashboardLogic() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clinic Clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  return {
    currentTime
  };
}
