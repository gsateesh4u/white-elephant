import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchState } from './api/client.js';
import { ParticipantList } from './components/ParticipantList.jsx';
import { GiftGrid } from './components/GiftGrid.jsx';
import { GiftPreviewDialog } from './components/GiftPreviewDialog.jsx';

const POLL_INTERVAL_MS = 5000;

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

const formatNextUp = (names) => {
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};

export default function ParticipantViewApp() {
  const initialParticipantCode = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('participant') || '';
  }, []);
  const [gameState, setGameState] = useState(createDefaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewGiftId, setPreviewGiftId] = useState(null);
  const [giftFilter, setGiftFilter] = useState('all');
  const [participantCodeInput, setParticipantCodeInput] = useState(initialParticipantCode);
  const [participantCode, setParticipantCode] = useState(initialParticipantCode);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (participantCode) {
      params.set('participant', participantCode);
    } else {
      params.delete('participant');
    }
    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${
      queryString ? `?${queryString}` : ''
    }${window.location.hash || ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [participantCode]);

  const handleParticipantInputChange = useCallback((event) => {
    setParticipantCodeInput(event.target.value);
  }, []);

  const handleParticipantLookup = useCallback(
    (event) => {
      event.preventDefault();
      const trimmed = participantCodeInput.trim();
      setParticipantCode(trimmed);
      setParticipantCodeInput(trimmed);
    },
    [participantCodeInput]
  );

  const handleParticipantClear = useCallback(() => {
    setParticipantCode('');
    setParticipantCodeInput('');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      try {
        const next = await fetchState();
        if (!cancelled) {
          setGameState(next);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load game state.');
          setLoading(false);
        }
      }
    };

    loadState();
    const interval = setInterval(loadState, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const participants = gameState?.participants ?? [];
  const gifts = gameState?.gifts ?? [];
  const giftPositions = useMemo(() => {
    const map = new Map();
    (gameState?.gifts ?? []).forEach((gift, index) => {
      map.set(gift.id, index + 1);
    });
    return map;
  }, [gameState?.gifts]);
  const matchedParticipant = useMemo(() => {
    if (!participantCode) {
      return null;
    }
    const normalized = participantCode.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    return (
      participants.find((participant) => participant.id.toLowerCase() === normalized) || null
    );
  }, [participantCode, participants]);

  const currentParticipant = useMemo(() => {
    if (!gameState?.currentParticipantId) {
      return null;
    }
    return participants.find((participant) => participant.id === gameState.currentParticipantId) || null;
  }, [participants, gameState?.currentParticipantId]);

  const revealedGiftCount = useMemo(
    () => gifts.filter((gift) => gift.revealed).length,
    [gifts]
  );
  const lockedGiftCount = useMemo(
    () => gifts.filter((gift) => gift.locked).length,
    [gifts]
  );
  const participantGift = useMemo(() => {
    if (!matchedParticipant) {
      return null;
    }
    return gifts.find((gift) => gift.originalOwnerParticipantId === matchedParticipant.id) || null;
  }, [gifts, matchedParticipant]);
  const participantGiftOwner = useMemo(() => {
    if (!participantGift?.winnerParticipantId) {
      return null;
    }
    return (
      participants.find((participant) => participant.id === participantGift.winnerParticipantId) ||
      null
    );
  }, [participants, participantGift?.winnerParticipantId]);

  const currentStatusMessage = useMemo(() => {
    if (!gameState?.gameStarted) {
      return 'Waiting for the host to kick things off.';
    }
    if (gameState?.gameCompleted) {
      return 'The game has wrapped up. Thanks for playing!';
    }
    if (gameState?.swapModeActive) {
      return currentParticipant
        ? `${currentParticipant.name} is deciding on a final swap.`
        : 'Final swap round is happening now.';
    }
    if (currentParticipant) {
      return `${currentParticipant.name} is choosing a gift.`;
    }
    return 'Preparing the next participant.';
  }, [gameState?.gameStarted, gameState?.gameCompleted, gameState?.swapModeActive, currentParticipant]);

  const upcomingParticipantNames = useMemo(() => {
    const turnOrder = Array.isArray(gameState?.upcomingTurnOrder)
      ? gameState.upcomingTurnOrder
      : [];
    return turnOrder
      .map((participantId) =>
        participants.find((participant) => participant.id === participantId)?.name || null
      )
      .filter(Boolean);
  }, [gameState?.upcomingTurnOrder, participants]);

  const nextUpSummary = useMemo(
    () => formatNextUp(upcomingParticipantNames.slice(0, 3)),
    [upcomingParticipantNames]
  );

  const sortedGifts = useMemo(() => {
    return gifts
      .slice()
      .sort((a, b) => {
        if (a.revealed !== b.revealed) {
          return a.revealed ? -1 : 1;
        }
        if (a.locked !== b.locked) {
          return a.locked ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [gifts]);
  const participantGiftPosition = useMemo(() => {
    if (!participantGift) {
      return null;
    }
    return giftPositions.get(participantGift.id) || null;
  }, [participantGift, giftPositions]);
  const highlightedGiftIds = participantGift ? [participantGift.id] : null;

  const giftFilterOptions = useMemo(() => {
    const wrappedCount = sortedGifts.length - revealedGiftCount;
    return [
      { value: 'all', label: 'All gifts', count: sortedGifts.length },
      { value: 'revealed', label: 'Opened gifts', count: revealedGiftCount },
      { value: 'wrapped', label: 'Wrapped gifts', count: wrappedCount },
      { value: 'locked', label: 'Locked gifts', count: lockedGiftCount },
    ];
  }, [sortedGifts, revealedGiftCount, lockedGiftCount]);

  const filteredGifts = useMemo(() => {
    switch (giftFilter) {
      case 'revealed':
        return sortedGifts.filter((gift) => gift.revealed);
      case 'wrapped':
        return sortedGifts.filter((gift) => !gift.revealed);
      case 'locked':
        return sortedGifts.filter((gift) => gift.locked);
      default:
        return sortedGifts;
    }
  }, [giftFilter, sortedGifts]);
  const participantGiftVisible = participantGift
    ? filteredGifts.some((gift) => gift.id === participantGift.id)
    : false;

  const previewGift = useMemo(() => {
    if (!previewGiftId) {
      return null;
    }
    return gifts.find((gift) => gift.id === previewGiftId) || null;
  }, [gifts, previewGiftId]);

  const previewOwner = useMemo(() => {
    if (!previewGift?.winnerParticipantId) {
      return null;
    }
    return participants.find((participant) => participant.id === previewGift.winnerParticipantId) || null;
  }, [participants, previewGift?.winnerParticipantId, previewGift]);

  const handlePreviewGift = (gift) => {
    if (!gift) {
      setPreviewGiftId(null);
      return;
    }
    setPreviewGiftId(gift.id);
  };

  const totalTurnsTaken = gameState?.completedTurnOrder?.length || 0;
  const totalGifts = sortedGifts.length;
  const spectatorMode = gameState?.swapModeActive ? 'swap' : 'turn';

  return (
    <div className="app participant-app">
      <header className="topbar spectator-topbar">
        <div>
          <h1>White Elephant Live View</h1>
          <p className="muted">{currentStatusMessage}</p>
        </div>
        <div className="spectator-status">
          <div className="spectator-status-item">
            <span className="label">Current turn</span>
            <span className="value">{currentParticipant?.name || 'TBD'}</span>
          </div>
          <div className="spectator-status-item">
            <span className="label">Opened gifts</span>
            <span className="value">
              {revealedGiftCount}/{totalGifts}
            </span>
          </div>
          <div className="spectator-status-item">
            <span className="label">Turns played</span>
            <span className="value">{totalTurnsTaken}</span>
          </div>
        </div>
      </header>

      <div className="spectator-helper">
        <h2>Check your gift position</h2>
        <form className="spectator-helper-form" onSubmit={handleParticipantLookup}>
          <label htmlFor="participant-code">Enter the code your host shared</label>
          <div className="input-row">
            <input
              id="participant-code"
              type="text"
              placeholder="e.g. p-alex"
              value={participantCodeInput}
              onChange={handleParticipantInputChange}
            />
            <button type="submit">Show my gift</button>
            {participantCode && (
              <button
                type="button"
                className="clear-button"
                onClick={handleParticipantClear}
              >
                Clear
              </button>
            )}
          </div>
        </form>
        {participantCode ? (
          <div className="helper-result">
            {!matchedParticipant ? (
              <span>
                No participant found with the code <strong>{participantCode}</strong>. Double-check your invite or ask the host.
              </span>
            ) : !participantGift ? (
              <span>
                We could not locate the gift seeded for <strong>{matchedParticipant.name}</strong>. Ask the host to confirm everyone&apos;s gift has been added.
              </span>
            ) : (
              <>
                <span>
                  Your gift appears at position <strong>#{participantGiftPosition ?? '?'}</strong> out of {totalGifts} gifts in tonight&apos;s lineup.
                </span>
                <p className="muted">
                  {participantGift.revealed
                    ? participantGiftOwner
                      ? `It has been revealed and is currently with ${participantGiftOwner.name}.`
                      : 'It has been revealed and is waiting to be claimed.'
                    : 'It is still wrapped—skip it when it is your turn to pick.'}
                </p>
                {!participantGiftVisible && (
                  <p className="muted">
                    Tip: select &ldquo;All gifts&rdquo; in the filters to see it highlighted on the grid.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="muted">
            Paste the personal participant code from your invite to highlight the gift you brought so you can avoid unwrapping it.
          </p>
        )}
      </div>

      {nextUpSummary && (
        <div className="spectator-next">
          <span className="label">Next up</span>
          <span className="value">{nextUpSummary}</span>
        </div>
      )}

      {error && <div className="toast error">{error}</div>}
      {loading && !error && <div className="toast info">Loading the latest game state...</div>}

      <main className="layout spectator-layout">
        <div className="left-column">
          {participants.length === 0 && !loading ? (
            <div className="panel empty-panel">
              <h2>Waiting for participants</h2>
              <p className="muted">Players will appear here once the host adds them to the game.</p>
            </div>
          ) : (
            <ParticipantList
              participants={participants}
              gifts={gifts}
              currentParticipantId={gameState?.currentParticipantId}
              firstParticipantId={gameState?.firstParticipantId}
              swapModeActive={Boolean(gameState?.swapModeActive)}
            />
          )}
        </div>

        <div className="right-column">
          <GiftGrid
            gifts={filteredGifts}
            participants={participants}
            currentParticipantId={gameState?.currentParticipantId}
            mode={spectatorMode}
            stealBlocks={gameState?.immediateStealBlocks || {}}
            filters={giftFilterOptions}
            activeFilter={giftFilter}
            onFilterChange={setGiftFilter}
            onPreview={handlePreviewGift}
            readonly
            highlightGiftIds={highlightedGiftIds}
            giftPositions={giftPositions}
          />
        </div>
      </main>

      <GiftPreviewDialog gift={previewGift} owner={previewOwner} onClose={() => setPreviewGiftId(null)} />
    </div>
  );
}
