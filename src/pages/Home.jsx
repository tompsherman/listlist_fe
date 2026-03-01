/**
 * Home Page - Main dashboard with tabs
 * 
 * Cold Start Handling:
 * - Shows cached data while server wakes
 * - Subtle "reconnecting" indicator if serverWaking
 * - Only shows error screen if no cached data AND error exists
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import GroceryList from '../components/GroceryList';
import PantryList from '../components/PantryList';
import MealsList from '../components/MealsList';
import PodSettings from '../components/PodSettings';
import ConnectionStatus from '../components/ConnectionStatus';
import './Home.css';

export default function Home({ tab = 'grocery' }) {
  const { currentPod, serverWaking } = useUser();
  const [activeTab, setActiveTab] = useState(tab);
  const [showSettings, setShowSettings] = useState(false);

  // V1 approach: No page-level loading gate.
  // App shell renders immediately. List components handle their own loading.

  return (
    <div className="home">
      {/* Server waking banner */}
      {serverWaking && (
        <div className="server-waking-banner">
          <span className="spinner-small" />
          Reconnecting to server...
        </div>
      )}
      
      <header className="home-header">
        <h1>🫛 ListList</h1>
        <div className="header-info">
          <ConnectionStatus />
          <button className="pod-btn" onClick={() => setShowSettings(true)}>
            {currentPod?.podName} ⚙️
          </button>
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
