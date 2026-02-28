import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { UserProvider } from './context/UserContext';
import App from './App';
import './styles/global.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Handle redirect after Auth0 login - restore the original URL
const onRedirectCallback = (appState) => {
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

// V1 Architecture: UserProvider wraps App (not inside it)
// This lets UserContext initialize early and show cached data immediately
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        redirectUri={window.location.origin}
        audience={audience}
        cacheLocation="localstorage"
        onRedirectCallback={onRedirectCallback}
      >
        <UserProvider>
          <App />
        </UserProvider>
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);
