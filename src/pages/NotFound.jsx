/**
 * 404 Page
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>
        Page not found
      </p>
      <Link to="/" style={{
        marginTop: '1rem',
        color: 'var(--color-primary)',
        textDecoration: 'underline',
      }}>
        Go Home
      </Link>
    </div>
  );
}
