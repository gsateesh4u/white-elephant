import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchState, login } from './api/client.js';
import { LoginForm } from './components/LoginForm.jsx';
import { LOCAL_STORAGE_HOST_NAME, LOCAL_STORAGE_TOKEN_KEY } from './constants.js';

const createEmptyState = () => ({
  participants: [],
  gifts: [],
  gameCompleted: false,
  gameStarted: false,
});

export default function HostSummaryApp() {
  const [host, setHost] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const token = window.localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    const hostName = window.localStorage.getItem(LOCAL_STORAGE_HOST_NAME);
    return token ? { token, hostName } : null;
  });
  const [gameState, setGameState] = useState(createEmptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const refreshState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await fetchState();
      setGameState(state);
    } catch (err) {
      setError(err.message || 'Unable to load game state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (host) {
      refreshState();
    } else {
      setGameState(createEmptyState());
    }
  }, [host, refreshState]);

  const handleLogin = useCallback(
    async (credentials) => {
      setLoginLoading(true);
      setLoginError(null);
      try {
        const response = await login(credentials);
        const nextHost = { token: response.token, hostName: response.hostName };
        setHost(nextHost);
        window.localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, response.token);
        window.localStorage.setItem(LOCAL_STORAGE_HOST_NAME, response.hostName || '');
      } catch (err) {
        setLoginError(err.message || 'Login failed. Please try again.');
      } finally {
        setLoginLoading(false);
      }
    },
    []
  );

  const handleSignOut = useCallback(() => {
    window.localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    window.localStorage.removeItem(LOCAL_STORAGE_HOST_NAME);
    setHost(null);
  }, []);

  const participantMap = useMemo(() => {
    return new Map((gameState?.participants || []).map((participant) => [participant.id, participant]));
  }, [gameState?.participants]);

  const summaryRows = useMemo(() => {
    return (gameState?.gifts || [])
      .map((gift) => {
        const owner = participantMap.get(gift.originalOwnerParticipantId) || null;
        const winner = gift.winnerParticipantId
          ? participantMap.get(gift.winnerParticipantId) || null
          : null;
        const winnerStatus = gift.winnerParticipantId
          ? winner
            ? null
            : 'Winner not found'
          : 'Gift not yet claimed';

        return {
          id: gift.id,
          giftName: gift.name,
          url: gift.url,
          ownerName: owner?.name || 'Unknown participant',
          ownerCountry: owner?.country || null,
          winnerName: winner?.name || (gift.winnerParticipantId ? 'Unknown participant' : 'Unclaimed'),
          winnerCountry: winner?.country || null,
          winnerStatus,
          isSelfMatch:
            Boolean(gift.winnerParticipantId) &&
            gift.winnerParticipantId === gift.originalOwnerParticipantId,
        };
      })
      .sort((a, b) => {
        const ownerCompare = a.ownerName.localeCompare(b.ownerName);
        if (ownerCompare !== 0) {
          return ownerCompare;
        }
        return a.giftName.localeCompare(b.giftName);
      });
  }, [gameState?.gifts, participantMap]);

  const summaryStats = useMemo(() => {
    const total = summaryRows.length;
    const unclaimed = summaryRows.filter((row) => row.winnerStatus === 'Gift not yet claimed').length;
    const selfMatches = summaryRows.filter((row) => row.isSelfMatch).length;
    return { total, unclaimed, selfMatches };
  }, [summaryRows]);

  if (!host) {
    return (
      <div className="app summary-app">
        <header className="summary-login-header">
          <h1>White Elephant Gift Summary</h1>
          <p className="muted">Sign in as the host to reveal the final gift matches.</p>
        </header>
        <div className="summary-login-panel">
          <LoginForm onSubmit={handleLogin} loading={loginLoading} error={loginError} />
        </div>
      </div>
    );
  }

  const gameReady = Boolean(gameState?.gameCompleted);
  const showAwaiting = !gameReady && !loading;

  return (
    <div className="app summary-app">
      <header className="topbar summary-topbar">
        <div>
          <h1>Gift Outcome Summary</h1>
          <p className="muted">
            Welcome back, {host.hostName || 'Host'}. Review every gift&apos;s journey below.
          </p>
        </div>
        <div className="summary-actions">
          <button type="button" className="secondary" onClick={refreshState} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="toast error">{error}</div>}
      {loading && <div className="toast info">Loading latest game state...</div>}

      {showAwaiting ? (
        <div className="panel summary-empty">
          <h2>Awaiting game completion</h2>
          <p className="muted">
            End the game from the control room once every gift has settled. The full summary will unlock
            automatically after the final turn.
          </p>
        </div>
      ) : gameReady ? (
        <div className="panel summary-panel">
          <div className="summary-panel-header">
            <h2>Final matches ({summaryStats.total} gifts)</h2>
            <div className="summary-metrics">
              <span>
                <strong>{summaryStats.selfMatches}</strong> guests left with their own gift
              </span>
              <span>
                <strong>{summaryStats.unclaimed}</strong> gifts remain unclaimed
              </span>
            </div>
          </div>
          <div className="summary-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Gift ID</th>
                  <th>Gift URL</th>
                  <th>Brought By</th>
                  <th>Won By</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row.id} className={row.isSelfMatch ? 'self-match' : undefined}>
                    <td>
                      <div className="summary-primary">
                        <code>{row.id}</code>
                      </div>
                      <div className="summary-secondary">{row.giftName}</div>
                    </td>
                    <td>
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="summary-link"
                        >
                          {row.url}
                        </a>
                      ) : (
                        <span className="summary-secondary">No link provided</span>
                      )}
                    </td>
                    <td>
                      <div className="summary-primary">{row.ownerName}</div>
                      {row.ownerCountry && <div className="summary-secondary">{row.ownerCountry}</div>}
                    </td>
                    <td>
                      <div className="summary-primary">{row.winnerName}</div>
                      {row.winnerCountry && (
                        <div className="summary-secondary">{row.winnerCountry}</div>
                      )}
                      {row.winnerStatus && <div className="summary-note">{row.winnerStatus}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
