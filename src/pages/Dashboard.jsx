import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  return (
    <div className="Dashboard">
      <h1>Welcome to ListList!</h1>
    </div>
  );
};

export default Dashboard;
