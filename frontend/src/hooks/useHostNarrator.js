import { useCallback, useEffect, useMemo, useRef } from 'react';

const DEFAULT_RATE = 1.03;
const DEFAULT_PITCH = 1.0;

const noop = () => {};

/**
 * Narrates the White Elephant game using the Web Speech API (when available).
 * The hook watches game state changes and queues up narration so the host can
 * guide players hands-free.
 */
export function useHostNarrator({ host, gameState, previousState, enabled = true }) {
  const speechSupported =
    typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';

  const queueRef = useRef([]);
  const speakingRef = useRef(false);
  const voiceRef = useRef(null);
  const hasGreetedRef = useRef(false);
  const lastAnnouncedTurnRef = useRef(null);
  const lastAnnouncedGiftRef = useRef(null);
  const lastAnnouncedShuffleRef = useRef(null);
  const swapIntroDeliveredRef = useRef(false);
  const lastJokeIndexRef = useRef(-1);

  const participants = gameState?.participants ?? [];
  const gifts = gameState?.gifts ?? [];
  const upcomingTurnOrder = gameState?.upcomingTurnOrder ?? [];

  const jokes = useMemo(
    () => [
      'If you do not like your gift, just remember, regifting is the circle of life - at least in this room.',
      'Nothing says team bonding like watching colleagues wrestle over a novelty waffle iron.',
      'Pro tip: a poker face is useless here. Wear your emotions like an ugly Christmas sweater.',
      "Stealing a gift is encouraged. Stealing someone's snacks is risky - choose wisely.",
      'This is the only meeting where shouting "Mine!" is considered productive participation.',
    ],
    []
  );

  const getParticipantById = useCallback(
    (state, id) => state?.participants?.find((participant) => participant.id === id),
    []
  );

  const getGiftById = useCallback(
    (state, id) => state?.gifts?.find((gift) => gift.id === id),
    []
  );

  const flushQueue = useCallback(() => {
    if (!speechSupported || !enabled) {
      queueRef.current = [];
      speakingRef.current = false;
      return;
    }

    if (speakingRef.current) {
      return;
    }

    const next = queueRef.current.shift();
    if (!next) {
      return;
    }

    speakingRef.current = true;
    const utterance = new SpeechSynthesisUtterance(next.text);
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    utterance.rate = next.rate ?? DEFAULT_RATE;
    utterance.pitch = next.pitch ?? DEFAULT_PITCH;
    utterance.volume = next.volume ?? 1.0;
    utterance.onend = () => {
      speakingRef.current = false;
      flushQueue();
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      flushQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSupported, enabled]);

  const enqueueSegments = useCallback(
    (segments, options = {}) => {
      if (!enabled) {
        return;
      }
      const items = segments
        .filter(Boolean)
        .map((segment) => (typeof segment === 'string' ? { text: segment } : segment));

      if (items.length === 0) {
        return;
      }

      if (!speechSupported) {
        items.forEach((item) => console.info(`[White Elephant Host] ${item.text}`));
        return;
      }

      if (options.interrupt) {
        window.speechSynthesis.cancel();
        queueRef.current = [];
        speakingRef.current = false;
      }

      queueRef.current.push(...items);
      flushQueue();
    },
    [flushQueue, speechSupported, enabled]
  );

  const selectPreferredVoice = useCallback(() => {
    if (!speechSupported) {
      return;
    }

    const voices = window.speechSynthesis.getVoices() ?? [];
    if (voices.length === 0) {
      return;
    }

    const localeMatch = voices.find((voice) => /en-(US|GB|AU|CA)/i.test(voice.lang));
    voiceRef.current = localeMatch ?? voices[0] ?? null;
  }, [speechSupported]);

  const getNextJoke = useCallback(() => {
    if (jokes.length === 0) {
      return null;
    }
    lastJokeIndexRef.current = (lastJokeIndexRef.current + 1) % jokes.length;
    return jokes[lastJokeIndexRef.current];
  }, [jokes]);

  const describeGiftReveal = useCallback(
    (gift, owner) => {
      if (!gift) {
        return;
      }

      const ownerName = owner?.name ?? 'our latest picker';
      const lines = [
        `${ownerName} just cracked open gift ${gift.name}!`,
        `It is ${gift.description}.`,
      ];

      if (gift.timesStolen > 0) {
        lines.push(`Heads up, this treasure has already been stolen ${gift.timesStolen} times!`);
      }

      enqueueSegments(lines);
      lastAnnouncedGiftRef.current = gift.id;
    },
    [enqueueSegments]
  );

  const announceNextTurn = useCallback(
    (participant, { isSwapPhase = false } = {}) => {
      if (!participant) {
        return;
      }

      const lines = isSwapPhase
        ? [
            `Swap round alert! ${participant.name}, you are on the clock.`,
            'Choose wisely - steal a revealed gift or pass to lock in your prize.',
          ]
        : [
            `${participant.name}, step up to the gift mountain!`,
            'Feel the suspense and pick a wrapped gift or steal a revealed one if you dare.',
          ];

      enqueueSegments(lines);
      lastAnnouncedTurnRef.current = participant.id;
    },
    [enqueueSegments]
  );

  const announceShuffle = useCallback(
    (firstParticipant) => {
      const firstUpName = firstParticipant?.name ?? 'our mystery friend';
      const firstUpCountry = firstParticipant?.country ? ` from ${firstParticipant.country}` : '';
      enqueueSegments(
        [
          'Names tossed, tickets shuffled, holiday chaos unlocked!',
          `Leading off, please welcome ${firstUpName}${firstUpCountry}. Come claim your destiny.`,
        ],
        { interrupt: true }
      );
      if (firstParticipant?.id) {
        lastAnnouncedTurnRef.current = firstParticipant.id;
      }
    },
    [enqueueSegments]
  );

  const announceSwapPhase = useCallback(() => {
    enqueueSegments([
      'All gifts are on the table! We are entering the final swap showdown.',
      'Remember, one last chance to steal before we call it a wrap.',
    ]);
  }, [enqueueSegments]);

  const announceGameEnd = useCallback(() => {
    const joke = getNextJoke();
    enqueueSegments([
      'That is a wrap! The White Elephant extravaganza has officially concluded.',
      'Snap a photo with your prize, thank your rivals, and cherish the chaos.',
      joke,
    ]);
  }, [enqueueSegments, getNextJoke]);

  const resetForNewGame = useCallback(() => {
    lastAnnouncedTurnRef.current = null;
    lastAnnouncedGiftRef.current = null;
    lastAnnouncedShuffleRef.current = null;
    swapIntroDeliveredRef.current = false;
  }, []);

  const hostDisplayName = host?.hostName || 'Host';

  const greetAudience = useCallback(
    (people) => {
      const total = people.length;
      const jokesToShare = [getNextJoke(), getNextJoke()].filter(Boolean);
      enqueueSegments(
        [
          `Ho ho ho! ${hostDisplayName} reporting for White Elephant duty.`,
          `We have ${total} gift lovers queued up and I am here to keep things merry and mildly competitive.`,
          'Rules refresher: when it is your turn you pick a wrapped gift or steal a revealed one.',
          'Gifts can only be stolen twice, so hoard carefully. When every gift is revealed, we enter a final swap round.',
          ...jokesToShare,
          'Ready the ribbon and warm up your best poker face - let the gifting games begin!',
        ],
        { interrupt: true }
      );
      hasGreetedRef.current = true;
    },
    [enqueueSegments, getNextJoke, hostDisplayName]
  );

  useEffect(() => {
    if (!speechSupported) {
      return noop;
    }

    selectPreferredVoice();
    window.speechSynthesis.onvoiceschanged = selectPreferredVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
      queueRef.current = [];
      speakingRef.current = false;
    };
  }, [selectPreferredVoice, speechSupported]);

  useEffect(() => {
    if (speechSupported || typeof window === 'undefined') {
      return;
    }
    console.info(
      '[White Elephant Host] Speech synthesis not supported. Narration will appear in the console.'
    );
  }, [speechSupported]);

  useEffect(() => {
    if (enabled) {
      return;
    }
    queueRef.current = [];
    speakingRef.current = false;
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
  }, [enabled, speechSupported]);

  useEffect(() => {
    if (!host) {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
      queueRef.current = [];
      speakingRef.current = false;
      hasGreetedRef.current = false;
      resetForNewGame();
    }
  }, [host, speechSupported, resetForNewGame]);

  useEffect(() => {
    if (!enabled || !host || participants.length === 0 || hasGreetedRef.current) {
      return;
    }
    greetAudience(participants);
  }, [enabled, host, participants, greetAudience]);

  useEffect(() => {
    const previousUpcoming = previousState?.upcomingTurnOrder ?? [];
    if (
      !enabled ||
      !host ||
      previousUpcoming.length === 0 ||
      upcomingTurnOrder.length === 0 ||
      gameState?.completedTurnOrder?.length > 0
    ) {
      return;
    }

    const prevKey = previousUpcoming.join('|');
    const currentKey = upcomingTurnOrder.join('|');
    if (prevKey === currentKey || lastAnnouncedShuffleRef.current === currentKey) {
      return;
    }

    lastAnnouncedShuffleRef.current = currentKey;
    const firstParticipant = getParticipantById(gameState, gameState.currentParticipantId);
    announceShuffle(firstParticipant);
  }, [
    announceShuffle,
    gameState,
    getParticipantById,
    host,
    enabled,
    previousState,
    upcomingTurnOrder,
  ]);

  useEffect(() => {
    if (!enabled || !host || !previousState || gifts.length === 0) {
      return;
    }

    const previousGiftMap = new Map(
      (previousState.gifts ?? []).map((gift) => [gift.id, gift])
    );

    const newlyRevealed = gifts.find((gift) => {
      const before = previousGiftMap.get(gift.id);
      return gift.revealed && (!before || !before.revealed);
    });

    if (!newlyRevealed || lastAnnouncedGiftRef.current === newlyRevealed.id) {
      return;
    }

    const owner = getParticipantById(gameState, newlyRevealed.ownerParticipantId);
    describeGiftReveal(newlyRevealed, owner);
  }, [enabled, describeGiftReveal, gameState, getParticipantById, gifts, host, previousState]);

  useEffect(() => {
    if (!enabled || !host || !previousState || gameState?.gameCompleted) {
      return;
    }

    const previousId = previousState?.currentParticipantId;
    const currentId = gameState?.currentParticipantId;

    if (!currentId || currentId === previousId || lastAnnouncedTurnRef.current === currentId) {
      return;
    }

    const participant = getParticipantById(gameState, currentId);
    if (participant) {
      announceNextTurn(participant, { isSwapPhase: Boolean(gameState?.swapModeActive) });
    }
  }, [enabled, announceNextTurn, gameState, getParticipantById, host, previousState]);

  useEffect(() => {
    if (
      !enabled ||
      !host ||
      !previousState ||
      previousState.swapModeActive ||
      !gameState?.swapModeActive ||
      swapIntroDeliveredRef.current
    ) {
      return;
    }
    swapIntroDeliveredRef.current = true;
    announceSwapPhase();
  }, [enabled, announceSwapPhase, gameState, host, previousState]);

  useEffect(() => {
    if (
      !enabled ||
      !host ||
      !previousState ||
      !gameState?.gameCompleted ||
      previousState.gameCompleted
    ) {
      return;
    }

    announceGameEnd();
  }, [enabled, announceGameEnd, gameState, host, previousState]);

  useEffect(() => {
    if (!gameState || gameState.completedTurnOrder?.length !== 0 || gameState.gameStarted) {
      return;
    }
    resetForNewGame();
  }, [gameState, resetForNewGame]);
}

