// Tracks how many API requests are currently in flight, so the UI can show
// a "waking up the server" banner during a Render free-tier cold start
// instead of leaving the user staring at a spinner with no explanation.
type Listener = (count: number) => void;

let inFlight = 0;
const listeners = new Set<Listener>();

export const requestStarted = () => {
  inFlight += 1;
  listeners.forEach((l) => l(inFlight));
};

export const requestFinished = () => {
  inFlight = Math.max(0, inFlight - 1);
  listeners.forEach((l) => l(inFlight));
};

export const subscribeToRequestActivity = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(inFlight);
  return () => listeners.delete(listener);
};
