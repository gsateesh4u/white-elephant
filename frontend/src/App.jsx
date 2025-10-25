import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchState,
  login,
  resetGame,
  shuffleParticipants,
  stealGift,
  unwrapGift,
  endGame,
  passTurn,
  finishCountrySwap,
} from './api/client.js';
import { LoginForm } from './components/LoginForm.jsx';
import { ParticipantList } from './components/ParticipantList.jsx';
import { GiftGrid } from './components/GiftGrid.jsx';
import { TurnControls } from './components/TurnControls.jsx';
import { FinalSwapPanel } from './components/FinalSwapPanel.jsx';
import { ActionOverlay } from './components/ActionOverlay.jsx';
import { GiftPreviewDialog } from './components/GiftPreviewDialog.jsx';
import { useCelebration } from './hooks/useCelebration.js';
import { useHostNarrator } from './hooks/useHostNarrator.js';
import {
  LOCAL_STORAGE_HOST_NAME,
  LOCAL_STORAGE_TOKEN_KEY,
  LOCAL_STORAGE_VOICE,
} from './constants.js';

const createDefaultState = () => ({
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
  immediateStealBlocks: {},
});

export default function App() {
  const [host, setHost] = useState(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    const hostName = localStorage.getItem(LOCAL_STORAGE_HOST_NAME);
    return token ? { token, hostName } : null;
  });
  const [gameState, setGameState] = useState(createDefaultState);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [giftFilter, setGiftFilter] = useState('all');
  const [previewGiftId, setPreviewGiftId] = useState(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem(LOCAL_STORAGE_VOICE);
    return stored === null ? true : stored === 'true';
  });
  const celebration = useCelebration();
  const confirm = useConfirm();
  const previousStateRef = useRef();
  const overlayTimeoutRef = useRef(null);
  const placeholderStateRef = useRef(createDefaultState());
  const previousStateSnapshotRef = useRef();


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
            setPreviewGiftId(gift.id);
          } else if (!before.locked && gift.locked) {
            celebration('locked');
          }
        });
      }
      previousStateSnapshotRef.current = previous;
      setGameState(nextState);
      previousStateRef.current = nextState;
    },
    [celebration, setPreviewGiftId]
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

  const resetView = useCallback(() => {
    const nextState = createDefaultState();
    setGameState(nextState);
    placeholderStateRef.current = nextState;
    setGiftFilter('all');
    setError(null);
    previousStateRef.current = undefined;
    previousStateSnapshotRef.current = undefined;
    setPreviewGiftId(null);
    setShowAllCountries(false);
    setInitialLoading(false);
  }, [setGameState, setGiftFilter, setError, setInitialLoading, setPreviewGiftId, setShowAllCountries]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_VOICE, String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    if (host) {
      setInitialLoading(true);
      setGiftFilter('all');
      setError(null);
      refreshState();
    } else {
      resetView();
    }
  }, [host, refreshState, resetView, setInitialLoading, setGiftFilter, setError]);

  useEffect(() => {
    if (!previewGiftId) {
      return;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreviewGiftId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewGiftId, setPreviewGiftId]);

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

  const handleToggleAllCountries = useCallback(() => {
    setShowAllCountries((previous) => !previous);
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((previous) => !previous);
  }, []);

  const handlePreviewGift = useCallback(
    (gift) => {
      if (!gift?.id) {
        return;
      }
      setPreviewGiftId(gift.id);
    },
    [setPreviewGiftId]
  );

  const handleClosePreview = useCallback(() => {
    setPreviewGiftId(null);
  }, [setPreviewGiftId]);

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
      confirm('Shuffle participant order?', () => handleAction(() => shuffleParticipants(host.token), 'shuffle'));
    },
    [handleAction, host, setError, confirm]
  );

  const handleReset = () => {
    handleAction(() => resetGame(host.token));
  };

  const handleEnd = () => {
    handleAction(() => endGame(host.token));
  };

    const handleFinishCountrySwap = () => {
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      confirm('Lock gifts for this country?', () => handleAction(() => finishCountrySwap(host.token)));
    };

  const canShuffle =
    !gameState.gameStarted &&
    !gameState.gameCompleted &&
    gameState.completedTurnOrder.length === 0;

  const displayState = initialLoading ? placeholderStateRef.current : gameState;
  const swapModeActive = Boolean(
    displayState.swapModeActive || (displayState.finalSwapAvailable && !displayState.gameCompleted)
  );
  const currentParticipantId = displayState.currentParticipantId;
  const currentParticipant = displayState.participants.find(
    (participant) => participant.id === currentParticipantId
  );

  const currentCountry = currentParticipant?.country;
  const activeSwapCountry = displayState.currentCountry || null;
  const eligibleGifts = useMemo(() => {
    const giftsList = displayState.gifts || [];
    if (!currentCountry) {
      return giftsList;
    }
    return giftsList.filter((gift) => gift.country === currentCountry);
  }, [displayState.gifts, currentCountry]);

  const visibleGifts = useMemo(() => {
    if (showAllCountries) {
      return displayState.gifts || [];
    }
    return eligibleGifts;
  }, [showAllCountries, displayState.gifts, eligibleGifts]);

  const giftPositions = useMemo(() => {
    const map = new Map();
    (displayState.gifts || []).forEach((gift, index) => {
      map.set(gift.id, index + 1);
    });
    return map;
  }, [displayState.gifts]);

  const giftFilterOptions = useMemo(() => {
    const revealed = visibleGifts.filter((gift) => gift.revealed);
    const wrappedCount = visibleGifts.length - revealed.length;
    return [
      { value: 'wrapped', label: 'Show wrapped', count: wrappedCount },
      { value: 'revealed', label: 'Show revealed', count: revealed.length },
      { value: 'revealed-steals', label: 'Show revealed in steal counter asc', count: revealed.length },
      { value: 'all', label: 'Show all', count: visibleGifts.length },
    ];
  }, [visibleGifts]);

  const filteredGifts = useMemo(() => {
    switch (giftFilter) {
      case 'wrapped':
        return visibleGifts.filter((gift) => !gift.revealed);
      case 'revealed':
        return visibleGifts.filter((gift) => gift.revealed);
      case 'revealed-steals':
        return visibleGifts
          .filter((gift) => gift.revealed)
          .slice()
          .sort((a, b) => {
            if (a.timesStolen !== b.timesStolen) {
              return a.timesStolen - b.timesStolen;
            }
            return a.name.localeCompare(b.name);
          });
      default:
        return visibleGifts;
    }
  }, [visibleGifts, giftFilter]);

  let previewGift = null;
  if (previewGiftId) {
    previewGift =
      displayState.gifts.find((gift) => gift.id === previewGiftId) ||
      gameState?.gifts?.find((gift) => gift.id === previewGiftId) ||
      null;
  }

  let previewOwner = null;
  if (previewGift?.winnerParticipantId) {
    previewOwner =
      displayState.participants.find(
        (participant) => participant.id === previewGift.winnerParticipantId
      ) ||
      gameState?.participants?.find(
        (participant) => participant.id === previewGift.winnerParticipantId
      ) ||
      null;
  }

  const currentParticipantName = currentParticipant ? currentParticipant.name : 'Awaiting next participant';
  const currentParticipantCountry = currentParticipant?.country;

  useHostNarrator({
    host,
    gameState,
    previousState: previousStateSnapshotRef.current,
    enabled: voiceEnabled,
  });

  if (!host) {
    return (
      <div className="app">
        <LoginForm onSubmit={handleLogin} loading={actionLoading} error={error} />
      </div>
    );
  }

  return (
    <>
      <ConfirmationDialog dialog={confirmationDialog} />
      <div className="app">
      <header className="topbar">
        <div>
          <h1>White Elephant Control Room</h1>
          <p className="muted">Welcome back, {host.hostName || 'Host'}.</p>
        </div>
        <div className="topbar-status">
          <span className="topbar-status-label">Current participant</span>
          <span className="topbar-status-value">
            {currentParticipantName}
            {currentParticipantCountry ? ` · ${currentParticipantCountry}` : ''}
          </span>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className={`voice-toggle${voiceEnabled ? ' active' : ''}`}
            onClick={handleToggleVoice}
            aria-pressed={voiceEnabled}
            title={voiceEnabled ? 'Turn off voice host' : 'Turn on voice host'}
          >
            <span className="icon" aria-hidden="true">{voiceEnabled ? '🔊' : '🔇'}</span>
            <span className="label">{voiceEnabled ? 'Voice on' : 'Voice off'}</span>
          </button>
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
              countryName={activeSwapCountry}
              onPass={handlePass}
              onEnd={handleFinishCountrySwap}
            />
          )}
        </div>

        <div className="right-column">
          <GiftGrid
            gifts={filteredGifts}
            participants={displayState.participants}
            currentParticipantId={currentParticipantId}
            mode={swapModeActive ? 'swap' : 'turn'}
            stealBlocks={displayState.immediateStealBlocks}
            onReveal={handleReveal}
            onSteal={handleSteal}
            onPreview={handlePreviewGift}
            showAllCountries={showAllCountries}
            onToggleAllCountries={handleToggleAllCountries}
            filters={giftFilterOptions}
            activeFilter={giftFilter}
            onFilterChange={setGiftFilter}
            giftPositions={giftPositions}
          />
        </div>
      </main>
      <GiftPreviewDialog gift={previewGift} owner={previewOwner} onClose={handleClosePreview} />
      </div>
    </>
  );
}

