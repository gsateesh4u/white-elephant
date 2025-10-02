import { useState } from 'react';

export function LoginForm({ onSubmit, loading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <div className="card login-card">
      <h1>Host Control</h1>
      <p className="muted">Log in to manage the White Elephant game.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="host"
            autoFocus
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Start Hosting'}
        </button>
      </form>
    </div>
  );
}
