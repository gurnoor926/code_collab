import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function TopLoadingBar({ isLoading = false }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [delayedNotice, setDelayedNotice] = useState(false);

  const progressIntervalRef = useRef(null);
  const delayedTimeoutRef = useRef(null);
  const finishTimeoutRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }

      setVisible(true);
      setProgress((prev) => (prev > 0 ? prev : 15));

      // Trickle progress forward
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // As progress nears 90, slow down increments
          const remaining = 90 - prev;
          const step = Math.max(0.5, remaining * 0.12);
          return Math.min(90, prev + step);
        });
      }, 150);

      // If delayed for more than 700ms, show delayed hint
      delayedTimeoutRef.current = setTimeout(() => {
        setDelayedNotice(true);
      }, 700);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (delayedTimeoutRef.current) {
        clearTimeout(delayedTimeoutRef.current);
        delayedTimeoutRef.current = null;
      }

      setDelayedNotice(false);

      if (visible) {
        // Jump to 100% on complete
        setProgress(100);

        finishTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 300);
      }
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (delayedTimeoutRef.current) clearTimeout(delayedTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, [isLoading, visible]);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Application loading"
      className={`fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Loading Bar Track */}
      <div className="relative h-[3px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.8),0_0_6px_rgba(56,189,248,0.8)] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer light sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Floating Delayed Indicator for Slow API Calls */}
      {delayedNotice && (
        <div className="absolute right-4 top-4 pointer-events-auto flex items-center gap-2 rounded-full border border-indigo-500/30 bg-[#12121a]/95 px-3 py-1.5 shadow-2xl shadow-black/80 backdrop-blur-md animate-fade-in text-xs font-medium text-indigo-300">
          <Loader2 size={13} className="animate-spin text-indigo-400 shrink-0" />
          <span>Server is responding...</span>
        </div>
      )}
    </div>
  );
}
