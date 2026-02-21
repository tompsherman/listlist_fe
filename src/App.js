import React, { useEffect, useState, lazy, Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useUser } from "./context/UserContext";

// Eager load - needed immediately
import Marketing from "./pages/Marketing";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";
import "./App.css";

// Lazy load - only when needed (reduces initial bundle ~40%)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const MealsList = lazy(() => import("./components/MealsList"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading fallback component
const PageLoader = () => (
  <div className="loading-screen">
    <p>Loading...</p>
  </div>
);

const App = () => {
  // All hooks must be called unconditionally at the top
  const { user, isLoading } = useAuth0();
  const { currentPod, isLoading: userLoading } = useUser();
  const [listsInitialized, setListsInitialized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const vip = process.env.REACT_APP_WHITELIST.split("_");
  const ADMIN_EMAIL = "tpsherman703@gmail.com";
  // Check for /admin - use window.location directly to catch it during Auth0 redirect
  const currentPath = window.location.pathname;
  const isAdminRoute = currentPath === "/admin" || currentPath === "/admin/";
  
  // Debug logging - remove after fixing
  console.log("Current path (window):", currentPath, "React Router path:", location.pathname, "isAdminRoute:", isAdminRoute, "user:", user?.email);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.hamburger-menu')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

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

  // const homeRoute = () => navigate(`/`); // Future feature
  const groceryRoute = () => navigate(`/grocery`);
  const pantryRoute = () => navigate(`/pantry`);
  const mealsRoute = () => navigate(`/meals`);

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
    console.log("Admin route detected. User email:", user?.email, "ADMIN_EMAIL:", ADMIN_EMAIL);
    if (!user) {
      return (
        <div className="Admin">
          <h1>🔐 Admin Access Required</h1>
          <p>Please log in to access the admin panel.</p>
          <LoginButton />
        </div>
      );
    }
    // Case-insensitive email check
    if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return (
        <div className="Admin">
          <h1>🚫 Access Denied</h1>
          <p>You don't have permission to view this page.</p>
          <p style={{fontSize: '0.8rem', color: '#666'}}>Logged in as: {user.email}</p>
          <LogoutButton />
        </div>
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <Admin />
      </Suspense>
    );
  }

  // Not logged in - show marketing
  if (isLegit === "loggin") {
    return (
      <div>
        <Marketing />
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
        <div 
          className={`nav-btn ${location.pathname === '/grocery' || location.pathname === '/' ? 'nav-btn-active' : ''}`} 
          onClick={groceryRoute}
        >
          grocery
        </div>
        <div 
          className={`nav-btn ${location.pathname === '/pantry' ? 'nav-btn-active' : ''}`} 
          onClick={pantryRoute}
        >
          inventory
        </div>
        <div 
          className={`nav-btn ${location.pathname === '/meals' ? 'nav-btn-active' : ''}`} 
          onClick={mealsRoute}
        >
          meals
        </div>
        {/* Hamburger menu */}
        <div className="hamburger-menu">
          <div 
            className="hamburger-icon" 
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
          {menuOpen && (
            <div className="hamburger-dropdown">
              <div 
                className="dropdown-item"
                onClick={() => { setShowSettings(true); setMenuOpen(false); }}
              >
                ⚙️ Settings
              </div>
              <LogoutButton />
            </div>
          )}
        </div>
        {currentPod && (
          <div className="current-pod-indicator">
            {currentPod.pod_name}
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <Suspense fallback={<PageLoader />}>
          <Settings onClose={() => setShowSettings(false)} />
        </Suspense>
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard getList={"grocery"} />} />
          <Route path="/grocery" element={<Dashboard getList={"grocery"} />} />
          <Route path="/pantry" element={<Dashboard getList={"pantry"} />} />
          <Route path="/meals" element={<MealsList />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
