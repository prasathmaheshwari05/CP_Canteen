import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

const CHANNEL_NAME = 'cafe_auth';

export function broadcastLogout() {
  const ch = new BroadcastChannel(CHANNEL_NAME);
  ch.postMessage({ type: 'LOGOUT' });
  ch.close();
}

export function useAuthSync() {
  const navigate = useNavigate();
  const { clearAuth } = useAppStore();

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.onmessage = (e) => {
      if (e.data?.type === 'LOGOUT') {
        sessionStorage.removeItem('access_token');
        clearAuth();
        navigate('/login', { replace: true });
      }
    };
    return () => ch.close();
  }, [navigate]);
}
