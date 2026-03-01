/**
 * Login Page
 */

import { useAuth0 } from '@auth0/auth0-react';
import './Login.css';

export default function Login() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="login">
      <div className="login-card">
        <h1>🫛 ListList</h1>
        <p>Track your groceries, manage your pantry, plan your meals.</p>
        <button className="login-button" onClick={() => loginWithRedirect()}>
          Log In / Sign Up
        </button>
      </div>
    </div>
  );
}
