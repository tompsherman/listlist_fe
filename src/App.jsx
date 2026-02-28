/**
 * ListList - Main App
 * 
 * V1 Architecture: No global loading gate. App shell renders immediately.
 * UserProvider is in main.jsx and starts fetching early.
 * Individual components handle their own loading states.
 * 
 * Skeleton Key components available at /dev
 */

import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useUser } from './context/UserContext';
import { ToastProvider } from './components/ui';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import Dev from './pages/Dev';

export default function App() {
  const { isLoading: authLoading, isAuthenticated } = useAuth0();
  const { needsOnboarding, hasPendingInvites, invitedPods, completeOnboarding } = useUser();
  const location = useLocation();

  // /dev route accessible without auth (component showcase)
  if (location.pathname === '/dev') {
    return (
      <ToastProvider>
        <Dev />
      </ToastProvider>
    );
  }

  // Brief Auth0 check - only to prevent Login flash while reading localStorage.
  // With cacheLocation="localstorage", this resolves in <100ms for returning users.
  if (authLoading) {
    return null; // Blank screen briefly, no spinner
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Onboarding check (user is authenticated but needs setup)
  if (needsOnboarding) {
    return <Onboarding 
      onComplete={completeOnboarding} 
      hasPendingInvites={hasPendingInvites}
      invitedPods={invitedPods}
    />;
  }

  // App shell renders immediately - components fetch their own data
  return (
    <ToastProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/grocery" element={<Home tab="grocery" />} />
          <Route path="/pantry" element={<Home tab="pantry" />} />
          <Route path="/meals" element={<Home tab="meals" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}
