import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

import Marketing from "./pages/Marketing";
import Dashboard from "./pages/Dashboard";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";

import "./App.css";

const App = () => {
  //auth0 logic;
  const { user, isAuthenticated, isLoading } = useAuth0();
  //return: if authentic and authorized, show App, else Marketing page

  const vip = process.env.REACT_APP_WHITELIST.split("_");

  let isLegit = "";
  if (!user) {
    isLegit = "loggin";
  } else if (vip.includes(user.email)) {
    isLegit = true;
  } else {
    isLegit = false;
  }

  return isLoading ? (
    <div>Loading...</div>
  ) : isLegit === "loggin" ? (
    <div>
      <Marketing />
      <LoginButton />
    </div>
  ) : isLegit ? (
    <div className="App">
      <LoginButton />
      <LogoutButton />
      <Dashboard />
    </div>
  ) : (
    <div className="App">
      <p className="Hacker">
        Thank you for your interest! Unfortunately we are closed for alpha
        testing right now, don't worry, you're on the LIST for our beta test
      </p>
      <LogoutButton />
      <Marketing />
    </div>
  );
};

export default App;
