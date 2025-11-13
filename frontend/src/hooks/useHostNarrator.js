import { useEffect } from 'react';

const supportsSpeech =
  typeof window !== 'undefined' &&
  typeof window.speechSynthesis !== 'undefined' &&
  typeof window.SpeechSynthesisUtterance !== 'undefined';

export function useHostNarrator({ host, gameState, previousState, enabled }) {
  useEffect(() => {
    if (!supportsSpeech) {
      return;
    }
    if (!enabled) {
      window.speechSynthesis.cancel();
    }
  }, [enabled]);

  useEffect(() => {
    if (!supportsSpeech || !enabled || !host || !gameState) {
      return;
    }

    const messages = buildMessages(gameState, previousState);
    if (!messages.length) {
      return;
    }

    window.speechSynthesis.cancel();
    messages.forEach((text) => speak(text));
  }, [host, gameState, previousState, enabled]);
}

function speak(text) {
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

function buildMessages(current, previous) {
  const messages = [];
  if (!previous) {
    const name = getParticipantName(current, current?.currentParticipantId);
    if (name) {
      messages.push(`Welcome back! It's ${name}'s turn to pick a gift.`);
    } else {
      messages.push('White Elephant is ready. Waiting for the first participant.');
    }
    return messages;
  }

  if (current.currentParticipantId && current.currentParticipantId !== previous.currentParticipantId) {
    const name = getParticipantName(current, current.currentParticipantId);
    if (name) {
      messages.push(`${name}, it is your turn.`);
    }
  }

  const newlyRevealedNames = findNewlyRevealedGifts(current, previous)
    .map((gift) => `${gift.name} from ${gift.country}`);
  newlyRevealedNames.forEach((giftDescription) => {
    messages.push(`A gift has been unwrapped: ${giftDescription}.`);
  });

  if (current.swapModeActive && !previous.swapModeActive) {
    const country = current.currentCountry || 'this country';
    messages.push(`Swap round has begun for ${country}.`);
  }

  if (current.gameCompleted && !previous.gameCompleted) {
    messages.push('All gifts are locked. Thanks for playing White Elephant!');
  }

  return messages;
}

function getParticipantName(state, participantId) {
  if (!state || !participantId) {
    return null;
  }
  return state.participants?.find((participant) => participant.id === participantId)?.name || null;
}

function findNewlyRevealedGifts(current, previous) {
  if (!current?.gifts?.length) {
    return [];
  }

  const previousMap = new Map(
    (previous?.gifts || []).map((gift) => [gift.id, { revealed: gift.revealed }])
  );

  return current.gifts.filter((gift) => {
    if (!gift.revealed) {
      return false;
    }
    const before = previousMap.get(gift.id);
    return !before || !before.revealed;
  });
}
