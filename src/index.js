import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./context/UserContext";

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

// Handle redirect after Auth0 login - restore the original URL
const onRedirectCallback = (appState) => {
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

// Build authorizationParams - only include audience if configured
const authorizationParams = {
  redirect_uri: window.location.origin,
};
if (audience) {
  authorizationParams.audience = audience;
}

ReactDOM.render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={authorizationParams}
    onRedirectCallback={onRedirectCallback}
  >
    <UserProvider>
      <Router>
        <App />
      </Router>
    </UserProvider>
  </Auth0Provider>,
  document.getElementById("root")
);
