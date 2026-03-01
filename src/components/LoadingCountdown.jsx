/**
 * LoadingCountdown Component
 * 
 * Shows a friendly loading message with countdown timer
 * for cold-start delays (Render free tier wakeup)
 */

import './LoadingCountdown.css';

export default function LoadingCountdown({ 
  countdown, 
  message = "Waking up the server...",
  subMessage = "Free tier servers sleep when inactive"
}) {
  return (
    <div className="loading-countdown">
      <div className="loading-countdown__spinner" />
      
      <h2 className="loading-countdown__message">{message}</h2>
      
      {countdown !== null && countdown > 0 && (
        <div className="loading-countdown__timer">
          <span className="loading-countdown__number">{countdown}</span>
          <span className="loading-countdown__unit">seconds</span>
        </div>
      )}
      
      <p className="loading-countdown__sub">{subMessage}</p>
      
      <div className="loading-countdown__tips">
        <p>☕ This only happens after periods of inactivity</p>
        <p>⚡ Once awake, the app is fast!</p>
      </div>
    </div>
  );
}
