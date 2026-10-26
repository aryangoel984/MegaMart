'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeToRequestActivity } from '@/utils/requestActivity';

const SHOW_AFTER_MS = 3000;

/** Shows a "waking up the server" banner once a request has been in flight
 * for 3s+ — the free-tier Render API can take ~20-30s to cold-start, and
 * without this a user just sees a spinner with no explanation. */
export default function ColdStartBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeToRequestActivity((count) => {
      if (count > 0 && !timer) {
        timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
      } else if (count === 0 && timer) {
        clearTimeout(timer);
        timer = null;
        setVisible(false);
      }
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-sm font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
      <Loader2 className="w-4 h-4 animate-spin" />
      Waking up the server (free tier) — this can take up to 30 seconds on the first request.
    </div>
  );
}
