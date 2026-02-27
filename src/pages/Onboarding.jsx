/**
 * Onboarding Page
 * New user setup: username, pod name, invite emails
 * OR simplified flow for invited users (just username)
 */

import { useState } from 'react';
import api from '../services/api';
import './Onboarding.css';

export default function Onboarding({ onComplete, hasPendingInvites = false, invitedPods = [] }) {
  const [username, setUsername] = useState('');
  const [podName, setPodName] = useState('');
  const [invite1, setInvite1] = useState('');
  const [invite2, setInvite2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    
    // Invited users don't need pod name
    if (!hasPendingInvites && !podName.trim()) {
      setError('Please name your pod');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (hasPendingInvites) {
        // Invited user - just create account and join pods
        await api.post('/api/signup/accept', {
          username: username.trim(),
        });
      } else {
        // New user - create account with new pod
        const inviteEmails = [invite1, invite2].filter(e => e.trim());
        
        await api.post('/api/signup', {
          username: username.trim(),
          podName: podName.trim(),
          inviteEmails,
        });
      }

      onComplete();
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simplified flow for invited users
  if (hasPendingInvites) {
    const podNames = invitedPods.map(p => p.name).join(', ');
    
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <h1>You're Invited! 🫛</h1>
          <p className="subtitle">
            Join <strong>{podNames}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Your Name *</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., Tom"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Joining...' : '🫛 Join Pod'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Full onboarding for new users
  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <h1>Welcome to ListList! 🫛</h1>
        <p className="subtitle">Let's set up your kitchen</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Your Name *</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., Tom"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="podName">Pod Name *</label>
            <input
              id="podName"
              type="text"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              placeholder="e.g., The Sherman Kitchen"
              disabled={loading}
            />
            <span className="hint">Your household or group name</span>
          </div>

          <div className="field">
            <label htmlFor="invite1">Invite a Pod-mate (optional)</label>
            <input
              id="invite1"
              type="email"
              value={invite1}
              onChange={(e) => setInvite1(e.target.value)}
              placeholder="partner@email.com"
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="invite2">Invite another (optional)</label>
            <input
              id="invite2"
              type="email"
              value={invite2}
              onChange={(e) => setInvite2(e.target.value)}
              placeholder="roommate@email.com"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : '🚀 Create My Pod'}
          </button>
        </form>
      </div>
    </div>
  );
}
