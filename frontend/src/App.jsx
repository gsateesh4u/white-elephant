import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchState,
  login,
  resetGame,
  shuffleParticipants,
  stealGift,
  unwrapGift,
  endGame,
  finishCountrySwap,
} from './api/client.js';
import { LoginForm } from './components/LoginForm.jsx';
import { ParticipantList } from './components/ParticipantList.jsx';
import { GiftGrid } from './components/GiftGrid.jsx';
import { TurnControls } from './components/TurnControls.jsx';
import { FinalSwapPanel } from './components/FinalSwapPanel.jsx';
import { ActionOverlay } from './components/ActionOverlay.jsx';
import {
  ActionExperienceOverlay,
  EXPERIENCE_CONFIG,
} from './components/ActionExperienceOverlay.jsx';
import { GiftPreviewDialog } from './components/GiftPreviewDialog.jsx';
import { ConfirmationDialog } from './components/ConfirmationDialog.jsx';
import { HolidayPopup } from './components/HolidayPopup.jsx';
import { useCelebration } from './hooks/useCelebration.js';
import { useHostNarrator } from './hooks/useHostNarrator.js';
import { useConfirm } from './hooks/useConfirm.js';
import { useActionSounds } from './hooks/useActionSounds.js';
import { useHolidayMusic } from './hooks/useHolidayMusic.js';
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
  const [countryFilter, setCountryFilter] = useState('all');
  const [showHolidayPopup, setShowHolidayPopup] = useState(false);
  const [revealAnimationIds, setRevealAnimationIds] = useState(() => new Set());
  const revealAnimationTimersRef = useRef(new Map());
  const previousRevealGiftsRef = useRef(new Map());
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem(LOCAL_STORAGE_VOICE);
    return stored === null ? true : stored === 'true';
  });
  const celebration = useCelebration();
  const [confirmationDialog, confirm] = useConfirm();
  const { play: playSound } = useActionSounds();
  const { play: playHolidayMusic } = useHolidayMusic();
  const previousStateRef = useRef();
  const overlayTimeoutRef = useRef(null);
  const placeholderStateRef = useRef(createDefaultState());
  const previousStateSnapshotRef = useRef();
  const hostToken = host?.token || null;
  const autoCountryFilterRef = useRef('all');
  const [experienceType, setExperienceType] = useState(null);
  const experienceTimeoutRef = useRef(null);
  const experienceResolveRef = useRef(null);


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
        if (!previous.gameCompleted && nextState.gameCompleted) {
          setShowHolidayPopup(true);
        }
      } else if (nextState.gameCompleted) {
        setShowHolidayPopup(true);
      }
      previousStateSnapshotRef.current = previous;
      setGameState(nextState);
      previousStateRef.current = nextState;
    },
    [celebration, setPreviewGiftId]
  );

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchState(hostToken);
      applyState(state);
    } catch (err) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [applyState, hostToken]);

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
    setCountryFilter('all');
    setInitialLoading(false);
  }, [setGameState, setGiftFilter, setError, setInitialLoading, setPreviewGiftId, setCountryFilter]);

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

  const showExperience = useCallback((experienceKey) => {
    if (!experienceKey || !EXPERIENCE_CONFIG[experienceKey]) {
      return Promise.resolve();
    }
    if (experienceResolveRef.current) {
      experienceResolveRef.current();
      experienceResolveRef.current = null;
    }
    if (experienceTimeoutRef.current) {
      clearTimeout(experienceTimeoutRef.current);
      experienceTimeoutRef.current = null;
    }
    setExperienceType(experienceKey);
    return new Promise((resolve) => {
      experienceResolveRef.current = resolve;
      experienceTimeoutRef.current = setTimeout(() => {
        setExperienceType(null);
        experienceTimeoutRef.current = null;
        experienceResolveRef.current = null;
        resolve();
      }, EXPERIENCE_CONFIG[experienceKey].durationMs);
    });
  }, []);

  const cancelExperience = useCallback(() => {
    if (experienceTimeoutRef.current) {
      clearTimeout(experienceTimeoutRef.current);
      experienceTimeoutRef.current = null;
    }
    if (experienceResolveRef.current) {
      experienceResolveRef.current();
      experienceResolveRef.current = null;
    }
    setExperienceType(null);
  }, []);

  useEffect(() => () => cancelExperience(), [cancelExperience]);

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
    async (action, overlayType, experienceKey) => {
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      setActionLoading(true);
      setError(null);

      let experiencePromise = Promise.resolve();
      if (experienceKey) {
        experiencePromise = showExperience(experienceKey);
      }

      if (overlayType) {
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current);
        }
        setActiveOverlay(overlayType);
      }

      let success = false;
      try {
        const state = await action();
        await experiencePromise;
        applyState(state);
        success = true;
      } catch (err) {
        cancelExperience();
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
    [host, applyState, setError, setActiveOverlay, showExperience, cancelExperience]
  );

  const confirmAction = useCallback(
    (dialogOptions, action, overlayType, experienceType) => {
      confirm({
        title: dialogOptions.title,
        message: dialogOptions.message,
        confirmLabel: dialogOptions.confirmLabel,
        onConfirm: () => {
          if (dialogOptions.sound) {
            playSound(dialogOptions.sound);
          }
          handleAction(action, overlayType, experienceType);
        },
        onCancel: dialogOptions.onCancel,
      });
    },
    [confirm, handleAction, playSound]
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
      confirmAction(
        {
          title: 'Reveal gift?',
          message: 'Reveal this mystery gift for everyone to see?',
          confirmLabel: 'Reveal',
          sound: 'unwrap',
        },
        () =>
          unwrapGift(host.token, {
            participantId: gameState.currentParticipantId,
            giftId: gift.id,
          }),
        'unwrap',
        'unwrap'
      );
    },
    [confirmAction, host, gameState.currentParticipantId, setError]
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
      const ownerName =
        gameState.participants.find((participant) => participant.id === gift.winnerParticipantId)?.name ??
        'its current owner';
      confirmAction(
        {
          title: isSwapMode ? 'Swap gift?' : 'Steal gift?',
          message: isSwapMode
            ? `Swap "${gift.name}" with ${ownerName}?`
            : `Steal "${gift.name}" from ${ownerName}?`,
          confirmLabel: isSwapMode ? 'Swap' : 'Steal',
          sound: isSwapMode ? 'swap' : 'steal',
        },
        () =>
          stealGift(host.token, {
            participantId: gameState.currentParticipantId,
            giftId: gift.id,
          }),
        isSwapMode ? 'swap' : 'steal',
        isSwapMode ? 'swap' : 'steal'
      );
    },
    [
      confirmAction,
      host,
      gameState.swapModeActive,
      gameState.finalSwapAvailable,
      gameState.gameCompleted,
      gameState.currentParticipantId,
      gameState.participants,
      setError,
    ]
  );

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

  const handleShuffle = useCallback(
    () => {
      if (!host?.token) {
        setError('Host login required for that action.');
        return;
      }
      confirmAction(
        {
          title: 'Shuffle participants?',
          message: 'Randomize the play order before the game starts?',
          confirmLabel: 'Shuffle',
          sound: 'shuffle',
        },
        () => shuffleParticipants(host.token),
        'shuffle',
        'shuffle'
      );
    },
    [confirmAction, host, setError]
  );

  const handleReset = useCallback(() => {
    if (!host?.token) {
      setError('Host login required for that action.');
      return;
    }
    confirmAction(
      {
        title: 'Reset game?',
        message: 'This will erase the current game state and start over. Continue?',
        confirmLabel: 'Reset',
      },
      () => resetGame(host.token),
      undefined,
      'reset'
    );
  }, [confirmAction, host, setError]);

  const handleEnd = useCallback(() => {
    if (!host?.token) {
      setError('Host login required for that action.');
      return;
    }
    confirmAction(
      {
        title: 'End game?',
        message: 'Lock in all gifts and end the game?',
        confirmLabel: 'End game',
      },
      () => endGame(host.token)
    );
  }, [confirmAction, host, setError]);

  const handleFinishCountrySwap = useCallback(() => {
    if (!host?.token) {
      setError('Host login required for that action.');
      return;
    }
    confirmAction(
      {
        title: 'Lock this country?',
        message: 'Finalize swaps for this country and move on?',
        confirmLabel: 'Lock gifts',
      },
      () => finishCountrySwap(host.token),
      'swap',
      'swap'
    );
  }, [confirmAction, host, setError]);

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

  useEffect(() => {
    if (currentCountry !== 'India' && currentCountry !== 'US') {
      return;
    }
    if (countryFilter === autoCountryFilterRef.current) {
      setCountryFilter(currentCountry);
      autoCountryFilterRef.current = currentCountry;
    }
  }, [currentCountry, countryFilter]);
  const activeSwapCountry = displayState.currentCountry || null;
  const visibleGifts = useMemo(() => {
    const giftsList = displayState.gifts || [];
    if (countryFilter === 'all') {
      return giftsList;
    }
    return giftsList.filter((gift) => gift.country === countryFilter);
  }, [displayState.gifts, countryFilter]);

  const giftPositions = useMemo(() => {
    const map = new Map();
    (displayState.gifts || []).forEach((gift, index) => {
      map.set(gift.id, index + 1);
    });
    return map;
  }, [displayState.gifts]);

  useEffect(() => {
    const previousMap = previousRevealGiftsRef.current;
    const nextMap = new Map();
    const newlyRevealed = [];
    (displayState.gifts || []).forEach((gift) => {
      const previousGift = previousMap.get(gift.id);
      if (previousGift && !previousGift.revealed && gift.revealed) {
        newlyRevealed.push(gift.id);
      }
      nextMap.set(gift.id, gift);
    });
    previousRevealGiftsRef.current = nextMap;
    if (newlyRevealed.length === 0) {
      return;
    }
    newlyRevealed.forEach((giftId) => {
      setRevealAnimationIds((current) => {
        if (current.has(giftId)) {
          return current;
        }
        const next = new Set(current);
        next.add(giftId);
        return next;
      });
      if (revealAnimationTimersRef.current.has(giftId)) {
        clearTimeout(revealAnimationTimersRef.current.get(giftId));
      }
      const timer = setTimeout(() => {
        setRevealAnimationIds((current) => {
          if (!current.has(giftId)) {
            return current;
          }
          const next = new Set(current);
          next.delete(giftId);
          return next;
        });
        revealAnimationTimersRef.current.delete(giftId);
      }, 5000);
      revealAnimationTimersRef.current.set(giftId, timer);
    });
  }, [displayState.gifts]);

  useEffect(() => {
    return () => {
      revealAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
      revealAnimationTimersRef.current.clear();
    };
  }, []);

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
      <ActionExperienceOverlay type={experienceType} />

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
            filters={giftFilterOptions}
            activeFilter={giftFilter}
            onFilterChange={setGiftFilter}
            giftPositions={giftPositions}
            animatedRevealGiftIds={revealAnimationIds}
            revealAnimationGif={EXPERIENCE_CONFIG.unwrap.gif}
            countryFilter={countryFilter}
            onCountryFilterChange={setCountryFilter}
          />
        </div>
      </main>
      <GiftPreviewDialog gift={previewGift} owner={previewOwner} onClose={handleClosePreview} />
      {showHolidayPopup && (
        <HolidayPopup
          onClose={() => setShowHolidayPopup(false)}
          onPlayMusic={playHolidayMusic}
        />
      )}
      </div>
    </>
  );
}

