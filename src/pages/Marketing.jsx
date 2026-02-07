import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API_URL = "https://listlist-db.onrender.com/api";

const Marketing = () => {
  const { loginWithRedirect } = useAuth0();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formData, setFormData] = useState({
    pod_name: "",
    primary_email: "",
    invite_email_1: "",
    invite_email_2: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname,
      },
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.primary_email) {
      setError("Please enter your email");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/admin/signups`, formData);
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setError("This email has already signed up!");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="Marketing">
        <div className="signup-success">
          <h1>🫛 You're on the list!</h1>
          <p>
            Thanks for signing up! We'll review your request and send you an
            email when your pod is ready.
          </p>
          <p className="pea-pun">
            <em>We're so happy you want to be part of our pod!</em>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="Marketing">
      {/* Top buttons */}
      <div className="marketing-buttons">
        <button onClick={handleLogin} className="submit-btn">
          🫛 Log In
        </button>
      </div>

      <div className="hero">
        <h2>Are you listless?</h2>
        <h1>🫛 You need ListList!</h1>
        <p>
          The app full of lists for the listless household. Track your grocery
          lists, manage your pantry, and never forget what's in the fridge
          again.
        </p>
      </div>
      <div className="Marketing">
      <button 
          onClick={() => setShowSignupForm(!showSignupForm)} 
          className="submit-btn create-pod-btn"
        >
          🌸 Create Your Pod
        </button>
      </div>

      {showSignupForm && (
        <div className="signup-form-container">
          <h2>Create Your Pod</h2>
          <p className="pea-pun">
            <em>Like peas in a pod, but for groceries 🫛</em>
          </p>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-field">
              <label htmlFor="primary_email">Your Email *</label>
              <input
                type="email"
                id="primary_email"
                name="primary_email"
                value={formData.primary_email}
                onChange={handleChange}
                placeholder="you@email.com"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="pod_name">Pod Name (optional)</label>
              <input
                type="text"
                id="pod_name"
                name="pod_name"
                value={formData.pod_name}
                onChange={handleChange}
                placeholder="The Shermans, Apt 4B, etc."
              />
            </div>

            <div className="form-field">
              <label htmlFor="invite_email_1">Invite a Pod-mate (optional)</label>
              <input
                type="email"
                id="invite_email_1"
                name="invite_email_1"
                value={formData.invite_email_1}
                onChange={handleChange}
                placeholder="roommate@email.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="invite_email_2">
                Invite another Pod-mate (optional)
              </label>
              <input
                type="email"
                id="invite_email_2"
                name="invite_email_2"
                value={formData.invite_email_2}
                onChange={handleChange}
                placeholder="partner@email.com"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Submitting..." : "🫛 Join the Pod"}
            </button>
          </form>

          <p className="fine-print">
            We're in alpha testing! After you sign up, we'll manually approve your
            pod (usually within 24 hours).
          </p>
        </div>
      )}
    </div>
  );
};

export default Marketing;
