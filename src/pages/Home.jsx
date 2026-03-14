/**
 * Home Page - Main dashboard with tabs
 * 
 * Cold Start Handling:
 * - Shows cached data while server wakes
 * - Subtle "reconnecting" indicator if serverWaking
 * - Only shows error screen if no cached data AND error exists
 * 
 * Progressive Tab Disclosure:
 * - Grocery tab always visible
 * - Pantry tab visible only if pantry has items
 * - Meals tab visible only if dishes exist
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useCachedData } from '../hooks';
import { listsApi } from '../services/lists';
import { dishesApi } from '../services/dishes';
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

  // Check if pantry has items (for progressive disclosure)
  const { data: pantryList } = useCachedData({
    key: currentPod ? `pantry_${currentPod.podId}` : null,
    fetchFn: async () => {
      const lists = await listsApi.getAll({ podId: currentPod.podId, type: 'pantry' });
      if (lists.length > 0) {
        return await listsApi.getById(lists[0]._id);
      }
      return null;
    },
    enabled: !!currentPod,
    coldStartMs: 30000,
  });

  // Check if dishes exist (for progressive disclosure)
  const { data: dishes } = useCachedData({
    key: currentPod ? `dishes_${currentPod.podId}` : null,
    fetchFn: async () => {
      return await dishesApi.getAll(currentPod.podId);
    },
    enabled: !!currentPod,
    coldStartMs: 30000,
  });

  const hasPantryItems = (pantryList?.items?.length || 0) > 0;
  const hasDishes = (dishes?.length || 0) > 0;

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
        {hasPantryItems && (
          <button
            className={`tab ${activeTab === 'pantry' ? 'active' : ''}`}
            onClick={() => setActiveTab('pantry')}
          >
            🏠 Pantry
          </button>
        )}
        {hasDishes && (
          <button
            className={`tab ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            🍽️ Meals
          </button>
        )}
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
