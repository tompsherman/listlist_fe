/**
 * Pod Settings Component
 * Manage members, invite people
 */

import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { podsApi } from '../services/pods';
import './PodSettings.css';

export default function PodSettings({ onClose }) {
  const { currentPod, user, refetch } = useUser();
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState(null);

  const isAdmin = currentPod?.role === 'admin';

  useEffect(() => {
    if (!currentPod) return;
    
    podsApi.get(currentPod.podId)
      .then(setPod)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPod]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentPod) return;

    setInviting(true);
    setMessage(null);

    try {
      await podsApi.invite(currentPod.podId, inviteEmail.trim());
      setMessage({ type: 'success', text: `Invited ${inviteEmail}` });
      setInviteEmail('');
      // Refresh pod data
      const updated = await podsApi.get(currentPod.podId);
      setPod(updated);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.username} from ${pod.name}?`)) return;

    try {
      await podsApi.removeMember(currentPod.podId, member.userId);
      const updated = await podsApi.get(currentPod.podId);
      setPod(updated);
      setMessage({ type: 'success', text: `Removed ${member.username}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) return <div className="pod-settings loading">Loading...</div>;

  return (
    <div className="pod-settings-overlay" onClick={onClose}>
      <div className="pod-settings" onClick={e => e.stopPropagation()}>
        <header>
          <h2>{pod?.name || 'Pod Settings'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {/* Members */}
        <section>
          <h3>Members ({pod?.members?.length || 0})</h3>
          <ul className="members-list">
            {pod?.members?.map(member => (
              <li key={member.userId}>
                <div className="member-info">
                  <span className="name">{member.username}</span>
                  <span className="role">{member.role}</span>
                </div>
                {isAdmin && member.userId !== user?.id && (
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveMember(member)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Invite (admin only) */}
        {isAdmin && (
          <section>
            <h3>Invite Someone</h3>
            <form onSubmit={handleInvite} className="invite-form">
              <input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                disabled={inviting}
              />
              <button type="submit" disabled={inviting || !inviteEmail.trim()}>
                {inviting ? '...' : 'Invite'}
              </button>
            </form>

            {/* Pending Invites */}
            {pod?.invites?.length > 0 && (
              <div className="pending-invites">
                <h4>Pending Invites</h4>
                <ul>
                  {pod.invites.map(inv => (
                    <li key={inv.email}>{inv.email}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Pod Switcher */}
        {user?.pods?.length > 1 && (
          <section>
            <h3>Switch Pod</h3>
            <p className="hint">You're in {user.pods.length} pods</p>
            {/* TODO: Pod switcher UI */}
          </section>
        )}
      </div>
    </div>
  );
}
