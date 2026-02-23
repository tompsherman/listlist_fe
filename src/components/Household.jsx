import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

const ROLE_LABELS = {
  admin: "👑 Admin",
  unrestricted: "✅ Full Access",
  helper: "🤝 Helper",
  restricted: "👀 View Only",
};

const Household = ({ onClose, onInvite }) => {
  const { 
    user, 
    currentPod, 
    switchPod, 
    apiCall, 
    refreshProfile,
    canManageMembers 
  } = useUser();
  
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchMembers = async () => {
    if (!currentPod) return;
    setLoadingMembers(true);
    try {
      const data = await apiCall("GET", `/me/pods/${currentPod.pod_id}/members`);
      setMembers(data.members || []);
    } catch (e) {
      console.error("Error fetching members:", e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (currentPod) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPod]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await apiCall("PUT", `/me/pods/${currentPod.pod_id}/members/${memberId}/role`, {
        role: newRole,
      });
      setMessage({ type: "success", text: "Role updated!" });
      fetchMembers();
      refreshProfile();
    } catch (e) {
      setMessage({ 
        type: "error", 
        text: e.response?.data?.message || "Error updating role" 
      });
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.email} from ${currentPod.pod_name}?`)) {
      return;
    }
    
    try {
      await apiCall("DELETE", `/me/pods/${currentPod.pod_id}/members/${member.user_id}`);
      setMessage({ type: "success", text: `${member.email} removed` });
      fetchMembers();
    } catch (e) {
      setMessage({ 
        type: "error", 
        text: e.response?.data?.message || "Error removing member" 
      });
    }
  };

  const handleLeavePod = async () => {
    if (!window.confirm(`Are you sure you want to leave ${currentPod.pod_name}?`)) {
      return;
    }
    
    try {
      await apiCall("DELETE", `/me/pods/${currentPod.pod_id}`);
      refreshProfile();
      onClose();
    } catch (e) {
      if (e.response?.data?.code === "LAST_ADMIN") {
        setMessage({ 
          type: "error", 
          text: "You're the last admin. Promote someone else first." 
        });
      } else if (e.response?.data?.code === "LAST_MEMBER") {
        if (window.confirm("You're the only member. Delete the pod?")) {
          try {
            await apiCall("DELETE", `/me/pods/${currentPod.pod_id}`, { deletePod: true });
            refreshProfile();
            onClose();
          } catch (e2) {
            setMessage({ type: "error", text: "Error deleting pod" });
          }
        }
      } else {
        setMessage({ 
          type: "error", 
          text: e.response?.data?.message || "Error leaving pod" 
        });
      }
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>👥 {currentPod?.pod_name || "My Household"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Pod Selection (if multiple) */}
        {user?.pods?.length > 1 && (
          <section className="settings-section">
            <h3>Switch Household</h3>
            <div className="pod-list">
              {user.pods.map((pod) => (
                <div 
                  key={pod.pod_id}
                  className={`pod-option ${currentPod?.pod_id === pod.pod_id ? 'active' : ''}`}
                  onClick={() => switchPod(pod.pod_id)}
                >
                  <span className="pod-name">{pod.pod_name}</span>
                  <span className="pod-role">{ROLE_LABELS[pod.role]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Members List */}
        {currentPod && (
          <section className="settings-section">
            <h3>Members</h3>
            <p className="your-role">Your role: {ROLE_LABELS[currentPod.role]}</p>
            
            {loadingMembers ? (
              <p>Loading members...</p>
            ) : (
              <div className="members-list">
                {members.map((member) => (
                  <div key={member.user_id} className="member-row">
                    <div className="member-info">
                      <span className="member-email">
                        {member.email} {member.is_me && "(you)"}
                      </span>
                      {canManageMembers() && !member.is_me ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                          className="role-select"
                        >
                          <option value="admin">👑 Admin</option>
                          <option value="unrestricted">✅ Full Access</option>
                          <option value="helper">🤝 Helper</option>
                          <option value="restricted">👀 View Only</option>
                        </select>
                      ) : (
                        <span className="role-badge">{ROLE_LABELS[member.role]}</span>
                      )}
                    </div>
                    {canManageMembers() && !member.is_me && (
                      <button 
                        className="remove-member-btn"
                        onClick={() => handleRemoveMember(member)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Invite Button */}
            {canManageMembers() && members.length < 3 && (
              <button 
                className="invite-btn"
                onClick={() => { onClose(); onInvite(); }}
              >
                + Invite Member
              </button>
            )}

            {/* Leave Pod */}
            <div className="leave-pod-section">
              <button 
                className="leave-pod-btn"
                onClick={handleLeavePod}
              >
                Leave Household
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Household;
