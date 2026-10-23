import { useEffect, useState } from "react";

/*
|--------------------------------------------------------------------------
| DealCountdown
|--------------------------------------------------------------------------
| Amazon "Lightning Deal" style live countdown. Pass either:
|   - endsAt: a Date/timestamp, or
|   - endsInMinutes: minutes from first render (used to seed a stable
|     deadline for mock data so it doesn't reset every re-render).
*/

function useCountdown(deadline) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadline - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(Math.max(0, deadline - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, expired: remainingMs <= 0 };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function DealCountdown({ endsAt, endsInMinutes, compact = false }) {
  const [deadline] = useState(() => {
    if (endsAt) return new Date(endsAt).getTime();
    return Date.now() + (endsInMinutes || 60) * 60 * 1000;
  });

  const { hours, minutes, seconds, expired } = useCountdown(deadline);

  if (expired) {
    return <span className="deal-countdown deal-countdown-expired">Deal ended</span>;
  }

  return (
    <div className={"deal-countdown" + (compact ? " deal-countdown-compact" : "")}>
      {!compact && <span className="deal-countdown-label">Ends in</span>}
      <span className="deal-countdown-unit">{pad(hours)}</span>
      <span className="deal-countdown-colon">:</span>
      <span className="deal-countdown-unit">{pad(minutes)}</span>
      <span className="deal-countdown-colon">:</span>
      <span className="deal-countdown-unit">{pad(seconds)}</span>
    </div>
  );
}
