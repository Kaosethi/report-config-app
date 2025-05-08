'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Adjust path
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const success = login(username, password); // Use the simulated login from context

    if (!success) {
      setError('Invalid username or password. Try admin/password.');
    }
    // Successful login is handled by the context (redirect)
  };

  // Basic styling (replace with Tailwind or CSS Modules if preferred)
  const styles = {
    container: { maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' },
    input: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' },
    button: { padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
    error: { color: 'red', marginTop: '10px' },
  };

  return (
    <div style={styles.container}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            style={styles.input}
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            style={styles.input}
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} type="submit">Login</button>
      </form>
    </div>
  );
}