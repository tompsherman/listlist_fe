import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "https://listlist-db.onrender.com/api";

const Admin = () => {
  const [signups, setSignups] = useState([]);
  const [pods, setPods] = useState([]);
  const [whitelist, setWhitelist] = useState({ whitelist: "", count: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [signupsRes, podsRes, whitelistRes] = await Promise.all([
        axios.get(`${API_URL}/admin/signups`),
        axios.get(`${API_URL}/admin/pods`),
        axios.get(`${API_URL}/admin/whitelist`),
      ]);
      setSignups(signupsRes.data);
      setPods(podsRes.data);
      setWhitelist(whitelistRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (signupId) => {
    setActionLoading(signupId);
    try {
      await axios.put(`${API_URL}/admin/signups/${signupId}/approve`);
      await fetchData();
    } catch (err) {
      console.error("Error approving:", err);
      alert("Error approving signup: " + (err.response?.data?.message || err.message));
    }
    setActionLoading(null);
  };

  const handleReject = async (signupId) => {
    setActionLoading(signupId);
    try {
      await axios.put(`${API_URL}/admin/signups/${signupId}/reject`);
      await fetchData();
    } catch (err) {
      console.error("Error rejecting:", err);
    }
    setActionLoading(null);
  };

  const copyWhitelist = () => {
    navigator.clipboard.writeText(whitelist.whitelist);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pending = signups.filter((s) => s.status === "pending");
  const approved = signups.filter((s) => s.status === "approved");
  const rejected = signups.filter((s) => s.status === "rejected");

  if (loading) {
    return <div className="Admin">Loading...</div>;
  }

  return (
    <div className="Admin">
      <h1>🫛 ListList Admin</h1>

      {/* Pending Signups */}
      <section className="admin-section">
        <h2>Pending Signups ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="empty-state">No pending signups 🎉</p>
        ) : (
          pending.map((signup) => (
            <div key={signup._id || signup.signup_id} className="signup-card pending">
              <div className="signup-info">
                <strong>{signup.pod_name}</strong>
                <span className="signup-date">
                  {new Date(signup.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="signup-emails">
                {signup.primary_email}
                {signup.invite_email_1 && `, ${signup.invite_email_1}`}
                {signup.invite_email_2 && `, ${signup.invite_email_2}`}
              </div>
              <div className="signup-actions">
                <button
                  onClick={() => handleApprove(signup._id || signup.signup_id)}
                  disabled={actionLoading === (signup._id || signup.signup_id)}
                  className="approve-btn"
                >
                  {actionLoading === (signup._id || signup.signup_id) ? "..." : "✓ Approve"}
                </button>
                <button
                  onClick={() => handleReject(signup._id || signup.signup_id)}
                  disabled={actionLoading === (signup._id || signup.signup_id)}
                  className="reject-btn"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Whitelist for Vercel */}
      <section className="admin-section whitelist-section">
        <h2>📋 Whitelist for Vercel ({whitelist.count} emails)</h2>
        <div className="whitelist-box">
          <code>{whitelist.whitelist || "(no approved signups yet)"}</code>
        </div>
        <button onClick={copyWhitelist} className="copy-btn">
          {copied ? "Copied! ✓" : "Copy to Clipboard"}
        </button>
        <p className="whitelist-instructions">
          Paste this into Vercel → Settings → Environment Variables →
          REACT_APP_WHITELIST
        </p>
      </section>

      {/* Approved / Rejected Summary */}
      <section className="admin-section">
        <div className="two-columns">
          <div>
            <h3>Approved ({approved.length})</h3>
            {approved.map((s) => (
              <div key={s._id || s.signup_id} className="mini-card approved">
                <strong>{s.pod_name}</strong>
                <span>
                  {[s.primary_email, s.invite_email_1, s.invite_email_2]
                    .filter(Boolean)
                    .length}{" "}
                  users
                </span>
              </div>
            ))}
          </div>
          <div>
            <h3>Rejected ({rejected.length})</h3>
            {rejected.map((s) => (
              <div key={s._id || s.signup_id} className="mini-card rejected">
                <strong>{s.pod_name}</strong>
                <span>{s.primary_email}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Pods */}
      <section className="admin-section">
        <h2>All Pods ({pods.length})</h2>
        <table className="pods-table">
          <thead>
            <tr>
              <th>Pod Name</th>
              <th>Members</th>
              <th>Lists</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <tr key={pod._id || pod.pod_id}>
                <td>{pod.pod_name}</td>
                <td>{pod.member_emails || "(no members)"}</td>
                <td>{pod.list_count}</td>
              </tr>
            ))}
            {pods.length === 0 && (
              <tr>
                <td colSpan="3" className="empty-state">
                  No pods yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Admin;
