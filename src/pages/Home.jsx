/**
 * Home Page - Main dashboard with tabs
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import './Home.css';

export default function Home({ tab = 'grocery' }) {
  const { user, currentPod, loading, error } = useUser();
  const [activeTab, setActiveTab] = useState(tab);

  if (loading) {
    return (
      <div className="home loading">
        <div className="loading-spinner" />
        <p>Loading your lists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="home">
      <header className="home-header">
        <h1>ListList</h1>
        <div className="header-info">
          <span className="pod-name">{currentPod?.podName}</span>
          <span className="user-name">{user?.username}</span>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'grocery' ? 'active' : ''}`}
          onClick={() => setActiveTab('grocery')}
        >
          🛒 Grocery
        </button>
        <button
          className={`tab ${activeTab === 'pantry' ? 'active' : ''}`}
          onClick={() => setActiveTab('pantry')}
        >
          🏠 Pantry
        </button>
        <button
          className={`tab ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          🍽️ Meals
        </button>
      </nav>

      <main className="content">
        {activeTab === 'grocery' && (
          <div className="tab-content">
            <h2>Grocery List</h2>
            <p className="placeholder">Grocery list will be here. Building in M3-M4...</p>
          </div>
        )}
        {activeTab === 'pantry' && (
          <div className="tab-content">
            <h2>Pantry</h2>
            <p className="placeholder">Pantry inventory will be here. Building in M5...</p>
          </div>
        )}
        {activeTab === 'meals' && (
          <div className="tab-content">
            <h2>Meals</h2>
            <p className="placeholder">Meal history will be here. Building in M6...</p>
          </div>
        )}
      </main>
    </div>
  );
}
