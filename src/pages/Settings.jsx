import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "../components/LogoutButton";

const ROLE_LABELS = {
  admin: "👑 Admin",
  unrestricted: "✅ Full Access",
  helper: "🤝 Helper",
  restricted: "👀 View Only",
};

const ROLE_DESCRIPTIONS = {
  admin: "Full access + manage members",
  unrestricted: "Can add items, shop, cook",
  helper: "Can help shop & cook, but not add items",
  restricted: "Can view only",
};

const Settings = ({ onClose }) => {
  const { 
    user, 
    currentPod, 
    switchPod, 
    apiCall, 
    refreshProfile,
    isAdmin,
    canManageMembers 
  } = useUser();
  const { user: auth0User } = useAuth0();
  
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("unrestricted");
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch pod members
  useEffect(() => {
    if (currentPod) {
      fetchMembers();
    }
  }, [currentPod]);

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
      
      setMessage({ type: "success", text: `${inviteEmail} invited!` });
      setInviteEmail("");
      setShowInviteForm(false);
      fetchMembers();
    } catch (e) {
      setMessage({ 
        type: "error", 
        text: e.response?.data?.message || "Error inviting member" 
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await apiCall("PUT", `/me/pods/${currentPod.pod_id}/members/${memberId}/role`, {
        role: newRole,
      });
      setMessage({ type: "success", text: "Role updated!" });
      fetchMembers();
      // Refresh profile in case we changed our own role
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
      setMessage({ type: "success", text: "Left pod" });
      refreshProfile();
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
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* User Profile Section */}
        <section className="settings-section">
          <h3>Your Profile</h3>
          <div className="profile-info">
            <p><strong>Email:</strong> {user?.email || auth0User?.email}</p>
            <p><strong>Name:</strong> {user?.username || auth0User?.name}</p>
          </div>
        </section>

        {/* Pod Selection */}
        {user?.pods?.length > 1 && (
          <section className="settings-section">
            <h3>Switch Pod</h3>
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

        {/* Current Pod Members */}
        {currentPod && (
          <section className="settings-section">
            <h3>{currentPod.pod_name} Members</h3>
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

            {/* Invite Form */}
            {canManageMembers() && members.length < 3 && (
              <div className="invite-section">
                {!showInviteForm ? (
                  <button 
                    className="invite-btn"
                    onClick={() => setShowInviteForm(true)}
                  >
                    + Invite Member
                  </button>
                ) : (
                  <form onSubmit={handleInvite} className="invite-form">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="unrestricted">Full Access</option>
                      <option value="helper">Helper</option>
                      <option value="restricted">View Only</option>
                    </select>
                    <div className="invite-actions">
                      <button type="submit" disabled={inviting}>
                        {inviting ? "Inviting..." : "Send Invite"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowInviteForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Leave Pod */}
            <div className="leave-pod-section">
              <button 
                className="leave-pod-btn"
                onClick={handleLeavePod}
              >
                Leave Pod
              </button>
            </div>
          </section>
        )}

        {/* Logout */}
        <section className="settings-section">
          <LogoutButton />
        </section>
      </div>
    </div>
  );
};

export default Settings;
