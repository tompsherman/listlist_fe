import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Route, Routes, useNavigate } from "react-router-dom";

import Marketing from "./pages/Marketing";
import Dashboard from "./pages/Dashboard";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";

import "./App.css";

const App = () => {
  //auth0 logic;
  const { user, isLoading } = useAuth0();
  //return: if authentic and authorized, show App, else Marketing page

  const vip = process.env.REACT_APP_WHITELIST.split("_");

  const navigate = useNavigate();
  const homeRoute = (event) => {
    navigate(`/`);
  };
  const groceryRoute = (event) => {
    navigate(`/grocery`);
  };
  const pantryRoute = (event) => {
    navigate(`/pantry`);
  };

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
      <div className="nav">
        <LogoutButton />
        <div className="button" onClick={homeRoute}>
          home
        </div>
        <div className="button" onClick={groceryRoute}>
          grocery
        </div>
        <div className="button" onClick={pantryRoute}>
          pantry
        </div>
        {/* <p>recipes</p> */}
        <p>add new list</p>
      </div>
      {/* <p>need an account set up flow:</p> */}
      {/* <ul>create pod (unecessary for T&K, harcode start)</ul>
      <ul>--- GET user_id from "pods"</ul>
      <ul>--- GET email from "users"</ul>
      <ul>create first list</ul>
      <ul>--- POST to "lists"</ul>
      <ul>--- POST user_id to </ul> */}
      <Routes>
        <Route path="/" element={<Dashboard getList={"*"} />} />
        <Route path="/grocery" element={<Dashboard getList={"grocery"} />} />
        <Route path="/pantry" element={<Dashboard getList={"pantry"} />} />
      </Routes>
      {/* <ul>---in tab Recipes GET pod_lists WHERE list.type === RECIPES RETURN DESCENDING</ul> */}

      <ul>
        {" "}
        MVP:
        <ul>
          go into shopping mode
          <ul>--- add check off toggles</ul>
          <ul>--- at the end of the trip</ul>
          <ul>--- add crossed off items to list "pantry"</ul>
          <ul>--- add non-crossed off items to new list "grocery"</ul>
        </ul>
        <ul>
          organizing pantry
          <ul>--- starting expiration countdowns</ul>
          <ul>adding items to pantry</ul>
          <ul>sort options (expiration / oldest, category type etc)</ul>
        </ul>
      </ul>
      <ul>
        {" "}
        REFACTORING MVP:
        <ul>
          item form
          <ul>--- state issues with radio button</ul>
          <ul>
            --- drop downs in form
            <ul>--- --- for category types</ul>
            <ul>--- --- for purchase and usage variables</ul>
          </ul>
          <ul>
            --- state issues with input form showing the previously input item
          </ul>
          <ul>--- logic like auto filling in expiration "never"</ul>
          <ul>--- "go back" buttons</ul>
        </ul>
        <ul>
          adding duplicate items
          <ul>--- edit item logic</ul>
        </ul>
      </ul>
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
