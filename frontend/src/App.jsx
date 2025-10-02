import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchState,
  login,
  resetGame,
  shuffleParticipants,
  stealGift,
  unwrapGift,
  endGame,
  passTurn,
} from './api/client.js';
import { LoginForm } from './components/LoginForm.jsx';
import { ParticipantList } from './components/ParticipantList.jsx';
import { GiftGrid } from './components/GiftGrid.jsx';
import { TurnControls } from './components/TurnControls.jsx';
import { FinalSwapPanel } from './components/FinalSwapPanel.jsx';
import { ActionOverlay } from './components/ActionOverlay.jsx';
import { useCelebration } from './hooks/useCelebration.js';

const LOCAL_STORAGE_TOKEN_KEY = 'white-elephant.hostToken';
const LOCAL_STORAGE_HOST_NAME = 'white-elephant.hostName';

const defaultState = {
  participants: [],
  gifts: [],
  upcomingTurnOrder: [],
  completedTurnOrder: [],
  currentParticipantId: null,
  gameStarted: false,
  gameCompleted: false,
  finalSwapAvailable: false,
  finalSwapUsed: false,
  swapModeActive: false,
  firstParticipantId: null,
};

export default function App() {
  const [host, setHost] = useState(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    const hostName = localStorage.getItem(LOCAL_STORAGE_HOST_NAME);
    return token ? { token, hostName } : null;
  });
  const [gameState, setGameState] = useState(defaultState);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [giftFilter, setGiftFilter] = useState('all');
  const celebration = useCelebration();
  const previousStateRef = useRef();
  const overlayTimeoutRef = useRef(null);

  const applyState = useCallback(
    (nextState) => {
      const previous = previousStateRef.current;
      if (previous) {
        const previousGiftMap = new Map(previous.gifts.map((gift) => [gift.id, gift]));
        nextState.gifts.forEach((gift) => {
          const before = previousGiftMap.get(gift.id);
          if (!before) {
            return;
          }
          if (!before.revealed && gift.revealed) {
            celebration('reveal');
          } else if (!before.locked && gift.locked) {
            celebration('locked');
          }
        });
      }
      setGameState(nextState);
      previousStateRef.current = nextState;
    },
    [celebration]
  );

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchState();
      applyState(state);
    } catch (err) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 5000);
    return () => clearInterval(interval);
  }, [refreshState]);

  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, []);

  const handleLogin = async (credentials) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await login(credentials);
      const nextHost = { token: response.token, hostName: response.hostName };
      setHost(nextHost);
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, response.token);
      localStorage.setItem(LOCAL_STORAGE_HOST_NAME, response.hostName);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = useCallback(
    async (action, overlayType) => {
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      setActionLoading(true);
      setError(null);

      if (overlayType) {
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current);
        }
        setActiveOverlay(overlayType);
      }

      let success = false;
      try {
        const state = await action();
        applyState(state);
        success = true;
      } catch (err) {
        setError(err.message);
      } finally {
        setActionLoading(false);
        if (overlayType) {
          if (success) {
            overlayTimeoutRef.current = setTimeout(() => {
              setActiveOverlay(null);
              overlayTimeoutRef.current = null;
            }, 1800);
          } else {
            setActiveOverlay(null);
          }
        }
      }
    },
    [host, applyState, setError, setActiveOverlay]
  );

  const handleReveal = useCallback(
    (gift) => {
      if (!gameState.currentParticipantId) {
        return;
      }
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      handleAction(
        () =>
          unwrapGift(host.token, {
            participantId: gameState.currentParticipantId,
            giftId: gift.id,
          }),
        'unwrap'
      );
    },
    [handleAction, host, gameState.currentParticipantId, setError]
  );

  const handleSteal = useCallback(
    (gift) => {
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      if (!gameState.currentParticipantId) {
        return;
      }
      const isSwapMode = Boolean(
        gameState.swapModeActive || (gameState.finalSwapAvailable && !gameState.gameCompleted)
      );
      handleAction(
        () =>
          stealGift(host.token, {
            participantId: gameState.currentParticipantId,
            giftId: gift.id,
          }),
        isSwapMode ? 'swap' : 'steal'
      );
    },
    [handleAction, host, gameState.swapModeActive, gameState.finalSwapAvailable, gameState.gameCompleted, gameState.currentParticipantId, setError]
  );

  const handlePass = useCallback(
    () => {
      if (!gameState.currentParticipantId) {
        return;
      }
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      const isSwapMode = Boolean(
        gameState.swapModeActive || (gameState.finalSwapAvailable && !gameState.gameCompleted)
      );
      if (!isSwapMode) {
        return;
      }
      handleAction(
        () =>
          passTurn(host.token, {
            participantId: gameState.currentParticipantId,
          }),
        'swap'
      );
    },
    [handleAction, host, gameState.swapModeActive, gameState.finalSwapAvailable, gameState.gameCompleted, gameState.currentParticipantId, setError]
  );

  const handleShuffle = useCallback(
    () => {
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      handleAction(() => shuffleParticipants(host.token), 'shuffle');
    },
    [handleAction, host, setError]
  );

  const handleReset = () => {
    handleAction(() => resetGame(host.token));
  };

  const handleEnd = () => {
    handleAction(() => endGame(host.token));
  };

  const canShuffle =
    !gameState.gameStarted &&
    !gameState.gameCompleted &&
    gameState.completedTurnOrder.length === 0;

  if (!host) {
    return (
      <div className="app">
        <LoginForm onSubmit={handleLogin} loading={actionLoading} error={error} />
      </div>
    );
  }

  const displayState = initialLoading ? defaultState : gameState;
  const swapModeActive = Boolean(
    displayState.swapModeActive || (displayState.finalSwapAvailable && !displayState.gameCompleted)
  );
  const currentParticipantId = displayState.currentParticipantId;
  const currentParticipant = displayState.participants.find(
    (participant) => participant.id === currentParticipantId
  );

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>White Elephant Control Room</h1>
          <p className="muted">Welcome back, {host.hostName || 'Host'}.</p>
        </div>
        <div className="topbar-actions">
          <button
            className="secondary"
            onClick={() => {
              localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
              localStorage.removeItem(LOCAL_STORAGE_HOST_NAME);
              setHost(null);
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="toast error">{error}</div>}
      {actionLoading && <div className="toast info">Working...</div>}
      {activeOverlay && <ActionOverlay type={activeOverlay} />}

      <main className="layout">
        <div className="left-column">
          <ParticipantList
            participants={displayState.participants}
            gifts={displayState.gifts}
            currentParticipantId={currentParticipantId}
            firstParticipantId={displayState.firstParticipantId}
            swapModeActive={swapModeActive}
          />

          <TurnControls
            onShuffle={handleShuffle}
            onReset={handleReset}
            onEnd={handleEnd}
            disabled={actionLoading}
            canShuffle={canShuffle}
            gameCompleted={displayState.gameCompleted}
            swapModeActive={swapModeActive}
          />

          {swapModeActive && !displayState.gameCompleted && currentParticipant && (
            <FinalSwapPanel
              currentParticipant={currentParticipant}
              onPass={handlePass}
              onEnd={handleEnd}
            />
          )}
        </div>

        <div className="right-column">
          <GiftGrid
            gifts={displayState.gifts}
            participants={displayState.participants}
            currentParticipantId={currentParticipantId}
            mode={swapModeActive ? 'swap' : 'turn'}
            onReveal={handleReveal}
            onSteal={handleSteal}
          />
        </div>
      </main>
    </div>
  );
}
