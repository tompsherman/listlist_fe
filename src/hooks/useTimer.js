import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useTimer
 * Countdown or stopwatch timer with start/pause/reset controls.
 *
 * @param {Object} options
 * @param {number} options.duration - Initial duration in seconds (for countdown mode)
 * @param {boolean} options.countdown - If true, counts down; if false, counts up (stopwatch)
 * @param {Function} options.onComplete - Callback when countdown reaches zero
 * @param {number} options.interval - Update interval in ms (default: 1000)
 *
 * @returns {Object} - { time, isRunning, start, pause, reset, toggle }
 *
 * @example
 * // Countdown timer
 * const { time, isRunning, start, pause, reset } = useTimer({
 *   duration: 60,
 *   countdown: true,
 *   onComplete: () => console.log('Time up!')
 * });
 *
 * @example
 * // Stopwatch
 * const { time, isRunning, start, pause, reset } = useTimer({
 *   countdown: false
 * });
 */
export default function useTimer({
  duration = 0,
  countdown = false,
  onComplete,
  interval = 1000,
} = {}) {
  const [time, setTime] = useState(countdown ? duration : 0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref current
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer tick logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTime((prevTime) => {
        if (countdown) {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            clearInterval(intervalRef.current);
            onCompleteRef.current?.();
            return 0;
          }
          return newTime;
        } else {
          return prevTime + 1;
        }
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, countdown, interval]);

  const start = useCallback(() => {
    if (countdown && time <= 0) return; // Don't start completed countdown
    setIsRunning(true);
  }, [countdown, time]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(countdown ? duration : 0);
  }, [countdown, duration]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  // Set time to specific value
  const setTimeTo = useCallback((newTime) => {
    setTime(Math.max(0, newTime));
  }, []);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    toggle,
    setTime: setTimeTo,
  };
}

/**
 * Format seconds into HH:MM:SS or MM:SS string
 * @param {number} totalSeconds
 * @param {boolean} forceHours - Always show hours even if 0
 * @returns {string}
 */
export function formatTime(totalSeconds, forceHours = false) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => n.toString().padStart(2, '0');

  if (hours > 0 || forceHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
