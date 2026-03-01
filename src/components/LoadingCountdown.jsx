/**
 * LoadingCountdown Component
 * 
 * Simple countdown timer for cold-start delays
 */

import './LoadingCountdown.css';

export default function LoadingCountdown({ countdown }) {
  return (
    <div className="loading-countdown">
      <span className="loading-countdown__text">
        Server loading in: {countdown ?? '...'}
      </span>
    </div>
  );
}
