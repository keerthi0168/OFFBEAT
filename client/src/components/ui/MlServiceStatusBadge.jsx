import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/utils/axios';

const badgeClasses = {
  online: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  fallback: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  checking: 'border-slate-400/30 bg-slate-500/10 text-slate-200',
};

const MlServiceStatusBadge = () => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking AI service…');

  useEffect(() => {
    let mounted = true;

    const loadHealth = async () => {
      try {
        const response = await axiosInstance.get('/ml/health');
        if (!mounted) return;

        const online = Boolean(response?.data?.online);
        const reason = response?.data?.reason;

        if (online) {
          setStatus('online');
          setMessage('AI mode: Online');
        } else {
          setStatus('fallback');
          setMessage(`AI mode: Fallback${reason ? ` (${reason})` : ''}`);
        }
      } catch (error) {
        if (!mounted) return;
        setStatus('fallback');
        setMessage('AI mode: Fallback (health endpoint unavailable)');
      }
    };

    loadHealth();
    const timer = setInterval(loadHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const className = useMemo(
    () => `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${badgeClasses[status] || badgeClasses.checking}`,
    [status],
  );

  return (
    <div className={className} title={message}>
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{message}</span>
    </div>
  );
};

export default MlServiceStatusBadge;
