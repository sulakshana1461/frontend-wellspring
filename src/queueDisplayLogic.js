import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

export function useQueueDisplayLogic() {
  const [activeWaitingQueue, setActiveWaitingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveWaitingQueue = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/doctor/queue`);
      // Preserve exact cashier-ordered queue returned by backend (queue_order ASC, id ASC)
      setActiveWaitingQueue(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load active waiting queue:', err.message);
      setError('Connection to server lost. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchActiveWaitingQueue();

    // Poll every 2 seconds for near-instant updates when Counter reorders the queue
    const interval = setInterval(fetchActiveWaitingQueue, 2000);
    return () => clearInterval(interval);
  }, [fetchActiveWaitingQueue]);

  return { activeWaitingQueue, loading, error };
}