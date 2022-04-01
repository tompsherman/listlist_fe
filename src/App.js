import React from "react";
import Marketing from "./pages/Marketing";
import Dashboard from "./pages/Dashboard";
import "./App.css";

const App = () => {
  //auth0 logic;
  //return: if authentic and authorized, show App, else Marketing page

  let isLegit = false;

  if (Math.random() >= 0.5) {
    isLegit = true;
  } else {
    isLegit = false;
  }

  return isLegit ? (
    <div className="App">
      <Dashboard />
    </div>
  ) : (
    <div className="App">
      <Marketing />
    </div>
  );
};

export default App;
