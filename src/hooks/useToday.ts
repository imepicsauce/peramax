import { useEffect, useState } from "react";
import { todayInManila } from "../lib/finance";
export function useToday() {
  const [today, setToday] = useState(todayInManila);
  useEffect(() => {
    const refresh = () => setToday(todayInManila());
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}
