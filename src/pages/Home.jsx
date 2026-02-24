/**
 * Home Page - Main dashboard with tabs
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import GroceryList from '../components/GroceryList';
import PantryList from '../components/PantryList';
import MealsList from '../components/MealsList';
import PodSettings from '../components/PodSettings';
import './Home.css';

export default function Home({ tab = 'grocery' }) {
  const { user, currentPod, loading, error, logout } = useUser();
  const [activeTab, setActiveTab] = useState(tab);
  const [showSettings, setShowSettings] = useState(false);

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
        <h1>🥕 ListList</h1>
        <div className="header-info">
          <button className="pod-btn" onClick={() => setShowSettings(true)}>
            {currentPod?.podName} ⚙️
          </button>
          <button className="logout-btn" onClick={logout}>Log out</button>
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
        {activeTab === 'grocery' && <GroceryList />}
        {activeTab === 'pantry' && <PantryList />}
        {activeTab === 'meals' && <MealsList />}
      </main>

      {showSettings && <PodSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
