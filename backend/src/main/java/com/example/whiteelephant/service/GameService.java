package com.example.whiteelephant.service;

import com.example.whiteelephant.dto.PassTurnRequest;
import com.example.whiteelephant.dto.GameStateResponse;
import com.example.whiteelephant.dto.LoginResponse;
import com.example.whiteelephant.dto.StealRequest;
import com.example.whiteelephant.dto.UnwrapRequest;
import com.example.whiteelephant.model.GameState;
import com.example.whiteelephant.model.Gift;
import com.example.whiteelephant.model.Participant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
public class GameService {
    private static final String HOST_USERNAME = "host";
    private static final String HOST_PASSWORD = "holidaypass";
    private static final String HOST_DISPLAY_NAME = "White Elephant Host";
    private static final int MAX_STEALS_PER_GIFT = 2;

    private final SecureRandom random = new SecureRandom();
    private final GameState state = new GameState();
    private String activeHostToken;

    @PostConstruct
    public synchronized void init() {
        resetGameState();
    }

    public synchronized void resetGameState() {
        state.getParticipants().clear();
        state.getGifts().clear();
        state.getTurnQueue().clear();
        state.getCompletedTurnOrder().clear();
        state.setGameStarted(false);
        state.setGameCompleted(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(false);
        state.setSwapModeActive(false);
        state.setCurrentParticipantId(null);
        state.setFirstParticipantId(null);
        activeHostToken = null;

        List<Participant> participants = seedParticipants();
        participants.forEach(state.getParticipants()::add);

        List<Gift> gifts = seedGifts(participants);
        gifts.forEach(state.getGifts()::add);

        participants.stream().map(Participant::getId).forEach(state.getTurnQueue()::add);
        state.setFirstParticipantId(state.getTurnQueue().peek());
        state.setCurrentParticipantId(state.getTurnQueue().peek());
    }

    private List<Participant> seedParticipants() {
        List<Participant> participants = new ArrayList<>();
        participants.add(new Participant("p-alex", "Alex Johnson", "https://i.pravatar.cc/150?img=12"));
        participants.add(new Participant("p-sam", "Sam Patel", "https://i.pravatar.cc/150?img=32"));
        participants.add(new Participant("p-maya", "Maya Chen", "https://i.pravatar.cc/150?img=45"));
        participants.add(new Participant("p-lena", "Lena Rivera", "https://i.pravatar.cc/150?img=18"));
        participants.add(new Participant("p-omar", "Omar Davis", "https://i.pravatar.cc/150?img=67"));
        participants.add(new Participant("p-tara", "Tara Singh", "https://i.pravatar.cc/150?img=23"));
        return participants;
    }

    private List<Gift> seedGifts(List<Participant> participants) {
        List<Gift> gifts = new ArrayList<>();
        gifts.add(new Gift("g-aurora-lamp", "Aurora Mood Lamp", "Color-shifting LED mood lamp", "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=400&q=80", participants.get(0).getId()));
        gifts.add(new Gift("g-coffee-lab", "Coffee Lab Kit", "Pour-over kit with specialty beans", "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=400&q=80", participants.get(1).getId()));
        gifts.add(new Gift("g-game-night", "Game Night Crate", "Board game bundle with snacks", "https://images.unsplash.com/photo-1606248897732-2c116d989e42?auto=format&fit=crop&w=400&q=80", participants.get(2).getId()));
        gifts.add(new Gift("g-cozy-throw", "Cozy Knit Throw", "Weighted knit blanket", "https://images.unsplash.com/photo-1505692794403-55b39dd74f81?auto=format&fit=crop&w=400&q=80", participants.get(3).getId()));
        gifts.add(new Gift("g-mixology", "Mixology Flight", "Craft cocktail infusion set", "https://images.unsplash.com/photo-1600195077075-0e4a87317f5f?auto=format&fit=crop&w=400&q=80", participants.get(4).getId()));
        gifts.add(new Gift("g-plant-buddy", "Plant Buddy", "Self-watering plant terrarium", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80", participants.get(5).getId()));
        return gifts;
    }

    public synchronized LoginResponse login(String username, String password) {
        if (!HOST_USERNAME.equalsIgnoreCase(username) || !HOST_PASSWORD.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        activeHostToken = generateToken();
        return new LoginResponse(activeHostToken, HOST_DISPLAY_NAME);
    }

    public synchronized boolean isAuthorized(String token) {
        return token != null && token.equals(activeHostToken);
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public synchronized GameStateResponse getState() {
        return GameStateResponse.from(state);
    }

    public synchronized GameStateResponse shuffleParticipants(String token) {
        requireHostToken(token);
        if (!state.getCompletedTurnOrder().isEmpty() || state.isGameStarted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot shuffle after the game has begun");
        }
        List<String> ids = new ArrayList<>();
        state.getParticipants().forEach(p -> ids.add(p.getId()));
        Collections.shuffle(ids, random);
        state.getTurnQueue().clear();
        ids.forEach(state.getTurnQueue()::add);
        state.setFirstParticipantId(state.getTurnQueue().peek());
        state.setCurrentParticipantId(state.getTurnQueue().peek());
        state.setSwapModeActive(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(false);
        return GameStateResponse.from(state);
    }

    public synchronized GameStateResponse unwrapGift(String token, UnwrapRequest request) {
        requireHostToken(token);
        validateCurrentParticipant(request.getParticipantId());
        Gift gift = state.findGift(request.getGiftId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));
        if (gift.isRevealed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift already revealed");
        }
        Participant participant = state.findParticipant(request.getParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        beginGameIfNeeded();
        gift.setRevealed(true);
        gift.setOwnerParticipantId(participant.getId());
        participant.setCurrentGiftId(gift.getId());
        recordCompletedParticipant(participant.getId());
        advanceTurnAfterAction();
        maybeAutoFinish();
        return GameStateResponse.from(state);
    }

    public synchronized GameStateResponse stealGift(String token, StealRequest request) {
        requireHostToken(token);
        validateCurrentParticipant(request.getParticipantId());
        Gift gift = state.findGift(request.getGiftId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));
        if (!gift.isRevealed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift has not been revealed yet");
        }
        if (gift.isLocked()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift can no longer be stolen");
        }
        if (Objects.equals(gift.getOwnerParticipantId(), request.getParticipantId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Participant already owns this gift");
        }

        Participant current = state.findParticipant(request.getParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
        Participant previousOwner = state.findParticipant(gift.getOwnerParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        beginGameIfNeeded();

        String previousGiftForCurrent = current.getCurrentGiftId();
        if (previousGiftForCurrent != null) {
            Gift previousGift = state.findGift(previousGiftForCurrent).orElse(null);
            if (previousGift != null) {
                previousGift.setOwnerParticipantId(null);
            }
        }

        current.setCurrentGiftId(gift.getId());
        gift.setOwnerParticipantId(current.getId());
        gift.incrementTimesStolen();

        if (gift.getTimesStolen() >= MAX_STEALS_PER_GIFT) {
            // lock by leaving owner assigned; isLocked derives from times stolen
        }

        previousOwner.setCurrentGiftId(null);

        recordCompletedParticipant(current.getId());
        rotateQueueAfterSteal(previousOwner.getId());
        maybeAutoFinish();
        return GameStateResponse.from(state);
    }

    public synchronized GameStateResponse passTurn(String token, PassTurnRequest request) {
        requireHostToken(token);
        ensureSwapModeActive();
        validateCurrentParticipant(request.getParticipantId());
        passCurrentParticipant();
        maybeAutoFinish();
        return GameStateResponse.from(state);
    }

    public synchronized GameStateResponse endGame(String token) {
        requireHostToken(token);
        finishGame();
        return GameStateResponse.from(state);
    }

    public synchronized GameStateResponse resetGame(String token) {
        requireHostToken(token);
        resetGameState();
        return GameStateResponse.from(state);
    }

    private void finishGame() {
        state.setGameCompleted(true);
        state.setSwapModeActive(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(true);
        state.setCurrentParticipantId(null);
        state.getTurnQueue().clear();
    }

    private void beginGameIfNeeded() {
        if (!state.isGameStarted()) {
            state.setGameStarted(true);
        }
    }

    private void validateCurrentParticipant(String participantId) {
        if (!Objects.equals(state.getCurrentParticipantId(), participantId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "It is not this participant's turn");
        }
        if (state.isGameCompleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The game has already completed");
        }
    }

    private void requireHostToken(String token) {
        if (!isAuthorized(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Host token is missing or invalid");
        }
    }

    private void recordCompletedParticipant(String participantId) {
        if (!state.getCompletedTurnOrder().contains(participantId)) {
            state.getCompletedTurnOrder().add(participantId);
        }
    }

    private void advanceTurnAfterAction() {
        String finishedId = state.getTurnQueue().poll();
        if (finishedId == null) {
            return;
        }

        if (state.isSwapModeActive()) {
            state.getTurnQueue().addLast(finishedId);
            state.setCurrentParticipantId(state.getTurnQueue().peek());
            return;
        }

        if (state.getTurnQueue().isEmpty()) {
            enterSwapMode();
        } else {
            state.setCurrentParticipantId(state.getTurnQueue().peek());
        }
    }

    private void rotateQueueAfterSteal(String returningParticipantId) {
        String actingParticipantId = state.getTurnQueue().poll();
        if (actingParticipantId != null && state.isSwapModeActive()) {
            state.getTurnQueue().addLast(actingParticipantId);
        }

        state.getTurnQueue().remove(returningParticipantId);
        state.getTurnQueue().addFirst(returningParticipantId);
        state.setCurrentParticipantId(returningParticipantId);

        if (!state.isSwapModeActive() && state.getTurnQueue().isEmpty()) {
            enterSwapMode();
        }
    }

    private void passCurrentParticipant() {
        String current = state.getTurnQueue().poll();
        if (current != null) {
            state.getTurnQueue().addLast(current);
        }
        state.setCurrentParticipantId(state.getTurnQueue().peek());
    }

    private void ensureSwapModeActive() {
        if (!state.isSwapModeActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Swap phase has not begun yet");
        }
    }

    private void enterSwapMode() {
        if (state.isSwapModeActive()) {
            return;
        }
        state.setSwapModeActive(true);
        state.setFinalSwapAvailable(true);
        state.setFinalSwapUsed(false);
        state.getTurnQueue().clear();
        state.getTurnQueue().addAll(state.getCompletedTurnOrder());
        state.setCurrentParticipantId(state.getTurnQueue().peek());
        maybeAutoFinish();
    }

    private void maybeAutoFinish() {
        if (!state.isSwapModeActive()) {
            return;
        }
        boolean anyStealable = state.getGifts().stream()
                .anyMatch(gift -> gift.isRevealed() && !gift.isLocked() && gift.getOwnerParticipantId() != null);
        if (!anyStealable) {
            finishGame();
        } else if (state.getTurnQueue().isEmpty()) {
            finishGame();
        }
    }
}
