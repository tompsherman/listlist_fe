import React, { useState } from "react";
import { useUser } from "../context/UserContext";

const InviteModal = ({ onClose }) => {
  const { currentPod, apiCall, canManageMembers } = useUser();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("unrestricted");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviting(true);
    setMessage(null);
    
    try {
      const data = await apiCall("POST", `/me/pods/${currentPod.pod_id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      
      // Open mailto link
      if (data.mailto) {
        window.location.href = data.mailto;
      }
      
      setMessage({ type: "success", text: `${inviteEmail} invited! Check your email app.` });
      setInviteEmail("");
      
      // Close after a moment
      setTimeout(() => onClose(), 2000);
    } catch (e) {
      setMessage({ 
        type: "error", 
        text: e.response?.data?.message || "Error inviting member" 
      });
    } finally {
      setInviting(false);
    }
  };

  if (!canManageMembers()) {
    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-panel invite-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2>✉️ Invite</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <p className="no-permission">Only admins can invite new members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel invite-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>✉️ Invite to {currentPod?.pod_name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleInvite} className="invite-form-standalone">
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="unrestricted">✅ Full Access - can add/edit items</option>
              <option value="helper">🤝 Helper - can shop & cook</option>
              <option value="restricted">👀 View Only - can only view</option>
            </select>
          </div>

          <div className="invite-actions">
            <button type="submit" className="primary-btn" disabled={inviting}>
              {inviting ? "Sending..." : "Send Invite"}
            </button>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
