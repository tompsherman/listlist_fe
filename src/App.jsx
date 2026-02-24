/**
 * ListList - Main App
 */

import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProvider } from './context/UserContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

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
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/grocery" element={<Home tab="grocery" />} />
          <Route path="/pantry" element={<Home tab="pantry" />} />
          <Route path="/meals" element={<Home tab="meals" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </UserProvider>
  );
}
