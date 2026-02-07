import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  
  const handleLogin = () => {
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname,
      },
    });
  };

  return (
    !isAuthenticated && (
      <button onClick={handleLogin}>Log In / Sign Up</button>
    )
  );
};

export default LoginButton;
