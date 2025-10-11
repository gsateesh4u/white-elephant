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
import java.util.Map;
import java.util.Objects;

@Service
public class GameService {
    private static final String HOST_USERNAME = "host";
    private static final String HOST_PASSWORD = "holidaypass";
    private static final String HOST_DISPLAY_NAME = "White Elephant Host";
    private static final int MAX_STEALS_PER_GIFT = 2;
    private static final int MAX_SWAPS_PER_GIFT = 2;

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
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
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
        participants.add(new Participant("p-alex", "Alex Johnson", "https://i.pravatar.cc/150?img=12", "US"));
        participants.add(new Participant("p-sam", "Sam Patel", "https://i.pravatar.cc/150?img=32", "India"));
        participants.add(new Participant("p-maya", "Maya Chen", "https://i.pravatar.cc/150?img=45", "Canada"));
        participants.add(new Participant("p-lena", "Lena Rivera", "https://i.pravatar.cc/150?img=18", "UK"));
        participants.add(new Participant("p-omar", "Omar Davis", "https://i.pravatar.cc/150?img=67", "US"));
        participants.add(new Participant("p-tara", "Tara Singh", "https://i.pravatar.cc/150?img=23", "India"));
        participants.add(new Participant("p-noah", "Noah Brooks", "https://i.pravatar.cc/150?img=41", "US"));
        participants.add(new Participant("p-riley", "Riley Kim", "https://i.pravatar.cc/150?img=16", "Canada"));
        participants.add(new Participant("p-ivy", "Ivy Martinez", "https://i.pravatar.cc/150?img=54", "UK"));
        participants.add(new Participant("p-zoe", "Zoe Thompson", "https://i.pravatar.cc/150?img=21", "US"));
        participants.add(new Participant("p-chris", "Chris Allen", "https://i.pravatar.cc/150?img=14", "UK"));
        participants.add(new Participant("p-jordan", "Jordan Lee", "https://i.pravatar.cc/150?img=37", "Canada"));
        participants.add(new Participant("p-amelia", "Amelia Turner", "https://i.pravatar.cc/150?img=9", "UK"));
        participants.add(new Participant("p-liam", "Liam Walker", "https://i.pravatar.cc/150?img=28", "US"));
        participants.add(new Participant("p-emma", "Emma Hughes", "https://i.pravatar.cc/150?img=52", "Canada"));
        participants.add(new Participant("p-harper", "Harper Scott", "https://i.pravatar.cc/150?img=48", "UK"));
        participants.add(new Participant("p-nico", "Nico Ramirez", "https://i.pravatar.cc/150?img=57", "India"));
        participants.add(new Participant("p-sophia", "Sophia Bennett", "https://i.pravatar.cc/150?img=11", "India"));
        participants.add(new Participant("p-owen", "Owen Parker", "https://i.pravatar.cc/150?img=44", "Canada"));
        participants.add(new Participant("p-lucas", "Lucas Nguyen", "https://i.pravatar.cc/150?img=35", "India"));
        return participants;
    }

    private List<Gift> seedGifts(List<Participant> participants) {
        List<Gift> gifts = new ArrayList<>();
        gifts.add(new Gift("g-aurora-lamp", "Aurora Mood Lamp", "Color-shifting LED mood lamp", "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=400&q=80", participants.get(0).getId(), participants.get(0).getCountry()));
        gifts.add(new Gift("g-coffee-lab", "Coffee Lab Kit", "Pour-over kit with specialty beans", "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=400&q=80", participants.get(1).getId(), participants.get(1).getCountry()));
        gifts.add(new Gift("g-game-night", "Game Night Crate", "Board game bundle with snacks", "https://images.unsplash.com/photo-1606248897732-2c116d989e42?auto=format&fit=crop&w=400&q=80", participants.get(2).getId(), participants.get(2).getCountry()));
        gifts.add(new Gift("g-cozy-throw", "Cozy Knit Throw", "Weighted knit blanket", "https://images.unsplash.com/photo-1505692794403-55b39dd74f81?auto=format&fit=crop&w=400&q=80", participants.get(3).getId(), participants.get(3).getCountry()));
        gifts.add(new Gift("g-mixology", "Mixology Flight", "Craft cocktail infusion set", "https://images.unsplash.com/photo-1600195077075-0e4a87317f5f?auto=format&fit=crop&w=400&q=80", participants.get(4).getId(), participants.get(4).getCountry()));
        gifts.add(new Gift("g-plant-buddy", "Plant Buddy", "Self-watering plant terrarium", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80", participants.get(5).getId(), participants.get(5).getCountry()));
        gifts.add(new Gift("g-smart-hydro", "Smart Hydro Garden", "Countertop herb-growing system", "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80", participants.get(6).getId(), participants.get(6).getCountry()));
        gifts.add(new Gift("g-brewer-kit", "Cold Brew Kit", "All-in-one cold brew set with beans", "https://images.unsplash.com/photo-1461988625982-7e46a099bf4f?auto=format&fit=crop&w=400&q=80", participants.get(7).getId(), participants.get(7).getCountry()));
        gifts.add(new Gift("g-chocolate-tour", "Chocolate Tour Box", "International artisan chocolate sampler", "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=400&q=80", participants.get(8).getId(), participants.get(8).getCountry()));
        gifts.add(new Gift("g-movie-marathon", "Movie Marathon Pack", "Projector-ready snack and film bundle", "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=400&q=80", participants.get(9).getId(), participants.get(9).getCountry()));
        gifts.add(new Gift("g-campfire-kit", "Campfire Comfort Kit", "Portable fire pit with s\'mores set", "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?auto=format&fit=crop&w=400&q=80", participants.get(10).getId(), participants.get(10).getCountry()));
        gifts.add(new Gift("g-artisan-tea", "Artisan Tea Flight", "Curated loose-leaf tasting collection", "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80", participants.get(11).getId(), participants.get(11).getCountry()));
        gifts.add(new Gift("g-vr-escape", "VR Escape Puzzle", "Immersive escape-room experience voucher", "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&w=400&q=80", participants.get(12).getId(), participants.get(12).getCountry()));
        gifts.add(new Gift("g-chef-toolkit", "Chef's Toolkit", "Premium knives and prep gadgets", "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80", participants.get(13).getId(), participants.get(13).getCountry()));
        gifts.add(new Gift("g-fitness-pack", "Fitness Essentials Pack", "Resistance kit with smart jump rope", "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=400&q=80", participants.get(14).getId(), participants.get(14).getCountry()));
        gifts.add(new Gift("g-photo-journey", "Photo Journey Set", "Instant camera with travel book", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80", participants.get(15).getId(), participants.get(15).getCountry()));
        gifts.add(new Gift("g-music-lounge", "Music Lounge Bundle", "Bluetooth speaker and vinyl sampler", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80", participants.get(16).getId(), participants.get(16).getCountry()));
        gifts.add(new Gift("g-spa-set", "Spa Retreat Set", "Aromatherapy and plush robe", "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=80", participants.get(17).getId(), participants.get(17).getCountry()));
        gifts.add(new Gift("g-tech-toy", "Tech Toy Drone", "Compact camera drone with controller", "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=400&q=80", participants.get(18).getId(), participants.get(18).getCountry()));
        gifts.add(new Gift("g-sculpt-kit", "Sculpt & Create Kit", "Ceramic sculpting starter bundle", "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80", participants.get(19).getId(), participants.get(19).getCountry()));
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
        if (!Objects.equals(participant.getCountry(), gift.getCountry())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift is not available to this participant");
        }

        state.getImmediateStealBlocks().remove(participant.getId());
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
        String blockedGiftId = state.getImmediateStealBlocks().get(request.getParticipantId());
        if (blockedGiftId != null && blockedGiftId.equals(gift.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot immediately steal back this gift");
        }
        if (Objects.equals(gift.getOwnerParticipantId(), request.getParticipantId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Participant already owns this gift");
        }

        Participant current = state.findParticipant(request.getParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
        Participant previousOwner = state.findParticipant(gift.getOwnerParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        if (!Objects.equals(current.getCountry(), gift.getCountry())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift is not available to this participant");
        }

        boolean isSwap = state.isSwapModeActive();
        Map<String, Integer> swapCounts = state.getGiftSwapCounts();
        int giftSwapCount = swapCounts.getOrDefault(gift.getId(), 0);
        if (isSwap && giftSwapCount >= MAX_SWAPS_PER_GIFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift has reached the maximum number of swaps");
        }

        state.getImmediateStealBlocks().remove(current.getId());
        beginGameIfNeeded();

        String previousGiftForCurrent = current.getCurrentGiftId();
        Gift previousGift = null;
        int previousGiftSwapCount = 0;
        if (previousGiftForCurrent != null) {
            previousGift = state.findGift(previousGiftForCurrent).orElse(null);
            if (isSwap && previousGift != null) {
                previousGiftSwapCount = swapCounts.getOrDefault(previousGift.getId(), 0);
                if (previousGiftSwapCount >= MAX_SWAPS_PER_GIFT) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Current participant's gift has reached the maximum number of swaps");
                }
            }
        }

        current.setCurrentGiftId(gift.getId());
        gift.setOwnerParticipantId(current.getId());
        gift.incrementTimesStolen();

        if (previousGift != null) {
            if (isSwap) {
                previousGift.setOwnerParticipantId(previousOwner.getId());
                previousOwner.setCurrentGiftId(previousGift.getId());
            } else {
                previousGift.setOwnerParticipantId(null);
                previousOwner.setCurrentGiftId(null);
            }
        } else {
            previousOwner.setCurrentGiftId(null);
        }

        if (isSwap) {
            swapCounts.put(gift.getId(), giftSwapCount + 1);
            if (previousGift != null) {
                swapCounts.put(previousGift.getId(), previousGiftSwapCount + 1);
            }
        }

        if (gift.getTimesStolen() >= MAX_STEALS_PER_GIFT) {
            // lock by leaving owner assigned; isLocked derives from times stolen
        }

        state.getImmediateStealBlocks().put(previousOwner.getId(), gift.getId());
        recordCompletedParticipant(current.getId());
        rotateQueueAfterSteal(previousOwner.getId());
        maybeAutoFinish();
        return GameStateResponse.from(state);
    }
    public synchronized GameStateResponse passTurn(String token, PassTurnRequest request) {
        requireHostToken(token);
        ensureSwapModeActive();
        validateCurrentParticipant(request.getParticipantId());
        state.getImmediateStealBlocks().remove(request.getParticipantId());
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
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
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

