'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Compass } from 'lucide-react';
import { getStoredUser } from '@/utils/auth';

/** Tells a guest (see POST /api/auth/guest) their data is temporary, so
 * they don't mistake a reset cart/order history for a bug later. */
export default function GuestBanner() {
  const [isGuest, setIsGuest] = useState(false);
  // The root layout (and this component within it) persists across
  // client-side navigations, so re-checking only needs to happen when the
  // route actually changes — e.g. right after guest login redirects.
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsGuest(Boolean(getStoredUser()?.isGuest));

    const onStorage = () => setIsGuest(Boolean(getStoredUser()?.isGuest));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname]);

  if (!isGuest) return null;

  return (
    <div className="bg-indigo-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 flex items-center justify-center gap-2 text-center">
      <Compass className="w-4 h-4 shrink-0" />
      Demo mode — you&apos;re browsing as a guest. Your cart and orders reset after 24 hours.
    </div>
  );
}
