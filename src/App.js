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
  // All hooks must be called unconditionally at the top
  const { user, isLoading } = useAuth0();
  const [listsInitialized, setListsInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const vip = process.env.REACT_APP_WHITELIST.split("_");
  const ADMIN_EMAIL = "tpsherman703@gmail.com";
  const isAdminRoute = location.pathname === "/admin";

  // Initialize default lists (pantry) for new users
  useEffect(() => {
    if (user && vip.includes(user.email) && !listsInitialized && !isAdminRoute) {
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
  }, [user, vip, listsInitialized, isAdminRoute]);

  const homeRoute = () => navigate(`/`);
  const groceryRoute = () => navigate(`/grocery`);
  const pantryRoute = () => navigate(`/pantry`);

  // Determine user status
  let isLegit = "";
  if (!user) {
    isLegit = "loggin";
  } else if (vip.includes(user.email)) {
    isLegit = true;
  } else {
    isLegit = false;
  }

  // Loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Admin route - requires auth + admin email
  if (isAdminRoute) {
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

  // Not logged in - show marketing
  if (isLegit === "loggin") {
    return (
      <div>
        <Marketing />
        <LoginButton />
      </div>
    );
  }

  // Logged in but not whitelisted
  if (isLegit === false) {
    return (
      <div className="App">
        <p className="Hacker">
          Thank you for your interest! Unfortunately we are closed for alpha
          testing right now, don't worry, you're on the LIST for our beta test
        </p>
        <LogoutButton />
        <Marketing />
      </div>
    );
  }

  // Logged in and whitelisted - show app
  return (
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
      </div>
      <Routes>
        <Route path="/" element={<Dashboard getList={"*"} />} />
        <Route path="/grocery" element={<Dashboard getList={"grocery"} />} />
        <Route path="/pantry" element={<Dashboard getList={"pantry"} />} />
      </Routes>
    </div>
  );
};

export default App;
