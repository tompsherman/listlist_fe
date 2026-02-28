/**
 * Timer Component
 * Countdown or stopwatch UI powered by useTimer hook.
 * Two modes switchable via prop.
 */

import { useTimer, formatTime } from '../../hooks';
import Button from './Button';
import './Timer.css';

export default function Timer({
  duration = 60,
  countdown = true,
  onComplete,
  autoStart = false,
  showControls = true,
  size = 'md',
  className = '',
}) {
  const {
    time,
    isRunning,
    start,
    pause,
    reset,
    toggle,
  } = useTimer({
    duration,
    countdown,
    onComplete,
  });

  // Auto-start on mount if requested
  if (autoStart && !isRunning && time === (countdown ? duration : 0)) {
    start();
  }

  // Determine display format based on time
  const forceHours = duration >= 3600 || time >= 3600;
  const displayTime = formatTime(time, forceHours);

  // Visual warning when countdown is low
  const isWarning = countdown && time <= 10 && time > 0;
  const isComplete = countdown && time === 0;

  return (
    <div
      className={`timer timer-${size} ${isWarning ? 'timer-warning' : ''} ${isComplete ? 'timer-complete' : ''} ${className}`}
    >
      <div className="timer-display" aria-live="polite">
        {displayTime}
      </div>

      {showControls && (
        <div className="timer-controls">
          <Button
            variant={isRunning ? 'secondary' : 'primary'}
            size={size === 'lg' ? 'md' : 'sm'}
            onClick={toggle}
            disabled={isComplete}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="ghost"
            size={size === 'lg' ? 'md' : 'sm'}
            onClick={reset}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
