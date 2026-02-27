/**
 * ListList - Main App
 */

import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProvider, useUser } from './context/UserContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';

function AppContent() {
  const { user, loading, error, needsOnboarding, hasPendingInvites, invitedPods, completeOnboarding } = useUser();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding 
      onComplete={completeOnboarding} 
      hasPendingInvites={hasPendingInvites}
      invitedPods={invitedPods}
    />;
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grocery" element={<Home tab="grocery" />} />
        <Route path="/pantry" element={<Home tab="pantry" />} />
        <Route path="/meals" element={<Home tab="meals" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
