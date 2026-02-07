import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import Marketing from "./pages/Marketing";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";

import "./App.css";

const App = () => {
  //auth0 logic;
  const { user, isLoading } = useAuth0();
  const [listsInitialized, setListsInitialized] = useState(false);
  const location = useLocation();
  //return: if authentic and authorized, show App, else Marketing page

  const vip = process.env.REACT_APP_WHITELIST.split("_");
  const ADMIN_EMAIL = "tpsherman703@gmail.com";

  // Admin page - requires auth + admin email
  if (location.pathname === "/admin") {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!user) {
      return (
        <div className="Admin">
          <h1>🔐 Admin Access Required</h1>
          <p>Please log in to access the admin panel.</p>
          <LoginButton />
        </div>
      );
    }
    if (user.email !== ADMIN_EMAIL) {
      return (
        <div className="Admin">
          <h1>🚫 Access Denied</h1>
          <p>You don't have permission to view this page.</p>
          <LogoutButton />
        </div>
      );
    }
    return <Admin />;
  }

  // Initialize default lists (pantry) for new users
  useEffect(() => {
    if (user && vip.includes(user.email) && !listsInitialized) {
      // Check if pantry list exists, create if not
      axios
        .get("https://listlist-db.onrender.com/api/lists/")
        .then((response) => {
          const lists = response.data;
          const hasPantry = lists.some((list) => list.type === "pantry");
          
          if (!hasPantry) {
            const currentTime = new Date().toDateString().split(" ");
            axios
              .post("https://listlist-db.onrender.com/api/lists/", {
                created_timestamp: `${currentTime[1]} ${currentTime[2]} ${currentTime[3]}`,
                list_open: true,
                type: "pantry",
                starred: "",
              })
              .then(() => {
                console.log("Pantry list created for new user");
                setListsInitialized(true);
              })
              .catch((err) => console.error("Error creating pantry:", err));
          } else {
            setListsInitialized(true);
          }
        })
        .catch((err) => console.error("Error checking lists:", err));
    }
  }, [user, vip, listsInitialized]);

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
        <div className="button">add new list</div>
        {/* <p>recipes</p> */}
        {/* <p>add new list</p> */}
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

      {/* <ul>
        {" "}
        MVP:
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
          <ul>--- logic like auto filling in expiration "never"</ul>
          <ul>--- "go back" buttons</ul>
        </ul>
        <ul>
          adding duplicate items
          <ul>--- edit item logic</ul>
        </ul>
      </ul> */}
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
