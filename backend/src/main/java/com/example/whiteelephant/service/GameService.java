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
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameService {
    private static final String HOST_USERNAME = "host";
    private static final String HOST_PASSWORD = "holidaypass";
    private static final String HOST_DISPLAY_NAME = "White Elephant Host";
    private static final int MAX_STEALS_PER_GIFT = 2;
    private static final int MAX_SWAPS_PER_GIFT = 2;
    private static final String PLAYER_IMAGE_PREFIX = "/api/assets/players/";

    private record ParticipantGiftSeed(
            String participantName,
            String photoPath,
            String country,
            String giftName,
            String giftDescription,
            String giftImageBaseName) {
    }

    private static final List<ParticipantGiftSeed> PARTICIPANT_GIFT_SEEDS = List.of(
            new ParticipantGiftSeed("Alex Johnson", PLAYER_IMAGE_PREFIX + "alex-johnson.png", "US",
                    "Aurora Mood Lamp", "Color-shifting LED mood lamp",
                    "aurora-mood-lamp"),
            new ParticipantGiftSeed("Sam Patel", PLAYER_IMAGE_PREFIX + "sam-patel.png", "India",
                    "Coffee Lab Kit", "Pour-over kit with specialty beans",
                    "coffee-lab-kit"),
            new ParticipantGiftSeed("Maya Chen", PLAYER_IMAGE_PREFIX + "maya-chen.png", "US",
                    "Game Night Crate", "Board game bundle with snacks",
                    "game-night-crate"),
            new ParticipantGiftSeed("Lena Rivera", PLAYER_IMAGE_PREFIX + "lena-rivera.png", "India",
                    "Cozy Knit Throw", "Weighted knit blanket",
                    "cozy-knit-throw"),
            new ParticipantGiftSeed("Omar Davis", PLAYER_IMAGE_PREFIX + "omar-davis.png", "US",
                    "Mixology Flight", "Craft cocktail infusion set",
                    "mixology-flight"),
            new ParticipantGiftSeed("Tara Singh", PLAYER_IMAGE_PREFIX + "tara-singh.png", "India",
                    "Plant Buddy", "Self-watering plant terrarium",
                    "plant-buddy"),
            new ParticipantGiftSeed("Noah Brooks", PLAYER_IMAGE_PREFIX + "noah-brooks.png", "US",
                    "Smart Hydro Garden", "Countertop herb-growing system",
                    "smart-hydro-garden"),
            new ParticipantGiftSeed("Riley Kim", PLAYER_IMAGE_PREFIX + "riley-kim.png", "India",
                    "Cold Brew Kit", "All-in-one cold brew set with beans",
                    "cold-brew-kit"),
            new ParticipantGiftSeed("Ivy Martinez", PLAYER_IMAGE_PREFIX + "ivy-martinez.png", "US",
                    "Chocolate Tour Box", "International artisan chocolate sampler",
                    "chocolate-tour-box"),
            new ParticipantGiftSeed("Zoe Thompson", PLAYER_IMAGE_PREFIX + "zoe-thompson.png", "India",
                    "Movie Marathon Pack", "Projector-ready snack and film bundle",
                    "movie-marathon-pack"),
            new ParticipantGiftSeed("Chris Allen", PLAYER_IMAGE_PREFIX + "chris-allen.png", "US",
                    "Campfire Comfort Kit", "Portable fire pit with s'mores set",
                    "campfire-comfort-kit"),
            new ParticipantGiftSeed("Jordan Lee", PLAYER_IMAGE_PREFIX + "jordan-lee.png", "India",
                    "Artisan Tea Flight", "Curated loose-leaf tasting collection",
                    "artisan-tea-flight"),
            new ParticipantGiftSeed("Amelia Turner", PLAYER_IMAGE_PREFIX + "amelia-turner.png", "US",
                    "VR Escape Puzzle", "Immersive escape-room experience voucher",
                    "vr-escape-puzzle"),
            new ParticipantGiftSeed("Liam Walker", PLAYER_IMAGE_PREFIX + "liam-walker.png", "India",
                    "Chef's Toolkit", "Premium knives and prep gadgets",
                    "chefs-toolkit"),
            new ParticipantGiftSeed("Emma Hughes", PLAYER_IMAGE_PREFIX + "emma-hughes.png", "US",
                    "Fitness Essentials Pack", "Resistance kit with smart jump rope",
                    "fitness-essentials-pack"),
            new ParticipantGiftSeed("Harper Scott", PLAYER_IMAGE_PREFIX + "harper-scott.png", "India",
                    "Photo Journey Set", "Instant camera with travel book",
                    "photo-journey-set"),
            new ParticipantGiftSeed("Nico Ramirez", PLAYER_IMAGE_PREFIX + "nico-ramirez.png", "US",
                    "Music Lounge Bundle", "Bluetooth speaker and vinyl sampler",
                    "music-lounge-bundle"),
            new ParticipantGiftSeed("Sophia Bennett", PLAYER_IMAGE_PREFIX + "sophia-bennett.png", "India",
                    "Spa Retreat Set", "Aromatherapy and plush robe",
                    "spa-retreat-set"),
            new ParticipantGiftSeed("Owen Parker", PLAYER_IMAGE_PREFIX + "owen-parker.png", "US",
                    "Tech Toy Drone", "Compact camera drone with controller",
                    "tech-toy-drone"),
            new ParticipantGiftSeed("Lucas Nguyen", PLAYER_IMAGE_PREFIX + "lucas-nguyen.png", "India",
                    "Sculpt & Create Kit", "Ceramic sculpting starter bundle",
                    "sculpt-and-create-kit"));

    private final AccessDatabaseService accessDatabaseService;
    private final SecureRandom random = new SecureRandom();
    private final GameState state = new GameState();
    private String activeHostToken;

    public GameService(AccessDatabaseService accessDatabaseService) {
        this.accessDatabaseService = Objects.requireNonNull(accessDatabaseService, "accessDatabaseService");
    }

    @PostConstruct
    public synchronized void init() {
        Optional<GameState> persistedState = accessDatabaseService.loadPersistedState();
        if (persistedState.isPresent()) {
            applyPersistedState(persistedState.get());
            activeHostToken = null;
        } else {
            resetGameState();
        }
    }

    public synchronized void resetGameState() {
        resetGameState(true);
    }

    private synchronized void resetGameState(boolean clearHostToken) {
        state.getParticipants().clear();
        state.getGifts().clear();
        state.getTurnQueue().clear();
        state.getCompletedTurnOrder().clear();
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
        state.getPendingSwapCountries().clear();
        state.setGameStarted(false);
        state.setGameCompleted(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(false);
        state.setSwapModeActive(false);
        state.setCurrentParticipantId(null);
        state.setFirstParticipantId(null);
        if (clearHostToken) {
            activeHostToken = null;
        }

        List<Participant> participants = loadOrSeedParticipants();
        state.getParticipants().addAll(participants);

        List<Gift> gifts = loadOrSeedGifts(participants);
        state.getGifts().addAll(gifts);

        initializeGlobalTurnOrder();
        persistState();
    }

    private void applyPersistedState(GameState snapshot) {
        state.getParticipants().clear();
        state.getParticipants().addAll(snapshot.getParticipants());

        state.getGifts().clear();
        state.getGifts().addAll(snapshot.getGifts());

        state.getTurnQueue().clear();
        state.getTurnQueue().addAll(snapshot.getTurnQueue());

        state.getSwapQueue().clear();
        state.getSwapQueue().addAll(snapshot.getSwapQueue());

        state.getPendingSwapCountries().clear();
        state.getPendingSwapCountries().addAll(snapshot.getPendingSwapCountries());

        state.getCompletedTurnOrder().clear();
        state.getCompletedTurnOrder().addAll(snapshot.getCompletedTurnOrder());

        state.getCountrySequence().clear();
        state.getCountrySequence().addAll(snapshot.getCountrySequence());

        state.getCompletedCountries().clear();
        state.getCompletedCountries().addAll(snapshot.getCompletedCountries());

        state.getImmediateStealBlocks().clear();
        state.getImmediateStealBlocks().putAll(snapshot.getImmediateStealBlocks());

        state.getGiftSwapCounts().clear();
        state.getGiftSwapCounts().putAll(snapshot.getGiftSwapCounts());

        state.setGameStarted(snapshot.isGameStarted());
        state.setGameCompleted(snapshot.isGameCompleted());
        state.setFinalSwapAvailable(snapshot.isFinalSwapAvailable());
        state.setFinalSwapUsed(snapshot.isFinalSwapUsed());
        state.setSwapModeActive(snapshot.isSwapModeActive());
        state.setFirstParticipantId(snapshot.getFirstParticipantId());
        state.setCurrentParticipantId(snapshot.getCurrentParticipantId());
        state.setCurrentCountry(snapshot.getCurrentCountry());
    }

    private List<Participant> loadOrSeedParticipants() {
        List<Participant> participants = accessDatabaseService.loadParticipants();
        if (participants.isEmpty()) {
            participants = seedParticipants();
            accessDatabaseService.replaceParticipants(participants);
        }
        return participants;
    }

    private List<Gift> loadOrSeedGifts(List<Participant> participants) {
        List<Gift> gifts = accessDatabaseService.loadGifts();
        if (gifts.isEmpty()) {
            gifts = seedGifts(participants);
            accessDatabaseService.replaceGifts(gifts);
        }
        return gifts;
    }

    private GameStateResponse fullStateResponse() {
        return GameStateResponse.from(state, true);
    }

    private void persistState() {
        accessDatabaseService.saveGameState(state);
    }

    private List<Participant> seedParticipants() {
        List<Participant> participants = new ArrayList<>(PARTICIPANT_GIFT_SEEDS.size());
        for (ParticipantGiftSeed seed : PARTICIPANT_GIFT_SEEDS) {
            String participantId = generateStableId("participant", seed.participantName(), seed.photoPath());
            System.out.println("Generated participant ID: " + participantId + " for " + seed.participantName());
            participants.add(new Participant(participantId, seed.participantName(), seed.photoPath(), seed.country()));
        }
        return participants;
    }

    private List<Gift> seedGifts(List<Participant> participants) {
        List<Gift> gifts = new ArrayList<>(PARTICIPANT_GIFT_SEEDS.size());
        for (int index = 0; index < PARTICIPANT_GIFT_SEEDS.size(); index++) {
            ParticipantGiftSeed seed = PARTICIPANT_GIFT_SEEDS.get(index);
            Participant participant = participants.get(index);
            List<String> imagePaths = buildLocalGiftImages(seed.giftImageBaseName());
            String giftId = generateStableId("gift", seed.giftName(), imagePaths.isEmpty() ? "" : imagePaths.get(0));
            String productSlug = toSlug(seed.giftName());
            String productUrl = "https://gift-guide.example/" + productSlug;
            gifts.add(new Gift(
                    giftId,
                    seed.giftName(),
                    seed.giftDescription(),
                    productUrl,
                    imagePaths,
                    participant.getId(),
                    participant.getCountry()
            ));
        }
        return gifts;
    }

    private List<String> buildLocalGiftImages(String baseName) {
        if (baseName == null || baseName.isBlank()) {
            return List.of();
        }
        return List.of(
                giftImagePath(baseName, 1),
                giftImagePath(baseName, 2),
                giftImagePath(baseName, 3)
        );
    }

    private String giftImagePath(String baseName, int variant) {
        return "/images/gifts/" + baseName + "-" + variant + ".png";
    }

    private void initializeGlobalTurnOrder() {
        state.getTurnQueue().clear();
        state.getParticipants().forEach(participant -> state.getTurnQueue().add(participant.getId()));
        state.setFirstParticipantId(state.getTurnQueue().peek());
        state.setCurrentParticipantId(state.getTurnQueue().peek());

        List<String> sequence = new ArrayList<>();
        state.getParticipants().forEach(participant -> {
            if (!sequence.contains(participant.getCountry())) {
                sequence.add(participant.getCountry());
            }
        });
        state.getCountrySequence().clear();
        state.getCountrySequence().addAll(sequence);
        state.getCompletedCountries().clear();
        state.getSwapQueue().clear();
        state.getPendingSwapCountries().clear();
        state.setCurrentCountry(null);
    }

    private List<String> getParticipantsForCountry(String country) {
        return state.getParticipants().stream()
                .filter(participant -> Objects.equals(participant.getCountry(), country))
                .map(Participant::getId)
                .collect(Collectors.toList());
    }

    private List<Gift> getGiftsForCountry(String country) {
        return state.getGifts().stream()
                .filter(gift -> Objects.equals(gift.getCountry(), country))
                .collect(Collectors.toList());
    }

    private boolean isGiftFullyLocked(Gift gift) {
        return gift != null && gift.getTimesStolen() >= MAX_STEALS_PER_GIFT;
    }

    private boolean maybeStartCountrySwap(String country) {
        if (country == null || state.getCompletedCountries().contains(country)) {
            return false;
        }
        if (!isCountryReadyForSwap(country)) {
            return false;
        }
        List<String> swapParticipants = getParticipantsForCountry(country);
        if (swapParticipants.isEmpty()) {
            state.getCompletedCountries().add(country);
            return false;
        }
        if (isLeadParticipantGiftLocked(swapParticipants)) {
            if (!state.getCompletedCountries().contains(country)) {
                state.getCompletedCountries().add(country);
            }
            return false;
        }
        if (state.isSwapModeActive()) {
            if (!state.getPendingSwapCountries().contains(country)) {
                state.getPendingSwapCountries().addLast(country);
            }
            return false;
        }
        state.setSwapModeActive(true);
        state.setFinalSwapAvailable(true);
        state.setFinalSwapUsed(false);
        state.setCurrentCountry(country);
        state.getSwapQueue().clear();
        swapParticipants.forEach(state.getSwapQueue()::add);
        state.setCurrentParticipantId(state.getSwapQueue().peek());
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
        return true;
    }

    private boolean isCountryReadyForSwap(String country) {
        return state.getGifts().stream()
                .filter(gift -> Objects.equals(gift.getCountry(), country))
                .allMatch(Gift::isRevealed);
    }

    private boolean isLeadParticipantGiftLocked(List<String> swapParticipants) {
        if (swapParticipants.isEmpty()) {
            return true;
        }
        String leadParticipantId = swapParticipants.get(0);
        Participant leadParticipant = state.findParticipant(leadParticipantId).orElse(null);
        if (leadParticipant == null) {
            return false;
        }
        String leadGiftId = leadParticipant.getCurrentGiftId();
        Gift leadGift = leadGiftId != null ? state.findGift(leadGiftId).orElse(null) : null;
        return isGiftFullyLocked(leadGift);
    }

    private static String generateStableId(String namespace, String... components) {
        String combined = namespace + ":" + String.join("|", components);
        return UUID.nameUUIDFromBytes(combined.getBytes(StandardCharsets.UTF_8))
                .toString()
                .replace("-", "");
    }

    private static String toSlug(String value) {
        String slug = value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug.isEmpty() ? "gift" : slug;
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

    public synchronized GameStateResponse getState(String token) {
        boolean includeSensitiveDetails = isAuthorized(token);
        return GameStateResponse.from(state, includeSensitiveDetails);
    }

    public synchronized GameStateResponse shuffleParticipants(String token) {
        requireHostToken(token);
        if (!state.getCompletedTurnOrder().isEmpty() || state.isGameStarted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot shuffle after the game has begun");
        }
        List<String> ids = new ArrayList<>();
        state.getParticipants().forEach(p -> ids.add(p.getId()));
        Collections.shuffle(ids, random);
        Map<String, Participant> byId = state.getParticipants().stream()
                .collect(Collectors.toMap(Participant::getId, participant -> participant));
        List<Participant> reordered = new ArrayList<>();
        ids.forEach(id -> reordered.add(byId.get(id)));
        state.getParticipants().clear();
        state.getParticipants().addAll(reordered);
        state.getCompletedTurnOrder().clear();
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
        state.setSwapModeActive(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(false);
        state.setGameStarted(false);
        initializeGlobalTurnOrder();
        persistState();
        return fullStateResponse();
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
        gift.setWinnerParticipantId(participant.getId());
        participant.setCurrentGiftId(gift.getId());
        recordCompletedParticipant(participant.getId());
        advanceTurnAfterAction();
        if (!maybeStartCountrySwap(participant.getCountry())) {
            updateCurrentParticipantFromGlobalQueueIfNeeded();
            tryFinalizeGameIfReady();
        } else {
            maybeAutoFinishCurrentCountry();
        }
        persistState();
        return fullStateResponse();
    }

    public synchronized GameStateResponse stealGift(String token, StealRequest request) {
        requireHostToken(token);
        validateCurrentParticipant(request.getParticipantId());
        Gift gift = state.findGift(request.getGiftId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));
        if (!gift.isRevealed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift has not been revealed yet");
        }
        if (isGiftFullyLocked(gift)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift can no longer be stolen");
        }
        String blockedGiftId = state.getImmediateStealBlocks().get(request.getParticipantId());
        if (blockedGiftId != null && blockedGiftId.equals(gift.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot immediately steal back this gift");
        }
        if (Objects.equals(gift.getWinnerParticipantId(), request.getParticipantId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Participant already owns this gift");
        }

        Participant current = state.findParticipant(request.getParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
        Participant previousOwner = state.findParticipant(gift.getWinnerParticipantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        if (!Objects.equals(current.getCountry(), gift.getCountry())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gift is not available to this participant");
        }

        boolean isSwap = state.isSwapModeActive();
        state.getImmediateStealBlocks().remove(current.getId());
        beginGameIfNeeded();

        String previousGiftForCurrent = current.getCurrentGiftId();
        Gift previousGift = previousGiftForCurrent != null ? state.findGift(previousGiftForCurrent).orElse(null) : null;

        if (isSwap && previousGift != null && isGiftFullyLocked(previousGift)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Current participant's gift has reached the maximum number of swaps");
        }

        current.setCurrentGiftId(gift.getId());
        gift.setWinnerParticipantId(current.getId());

        if (previousGift != null) {
            if (isSwap) {
                previousGift.setWinnerParticipantId(previousOwner.getId());
                previousOwner.setCurrentGiftId(previousGift.getId());
            } else {
                previousGift.setWinnerParticipantId(null);
                previousOwner.setCurrentGiftId(null);
            }
        } else {
            previousOwner.setCurrentGiftId(null);
        }

        gift.incrementTimesStolen();

        state.getImmediateStealBlocks().put(previousOwner.getId(), gift.getId());
        recordCompletedParticipant(current.getId());
        rotateQueueAfterSteal(previousOwner.getId());
        maybeAutoFinishCurrentCountry();
        persistState();
        return fullStateResponse();
    }

    public synchronized GameStateResponse passTurn(String token, PassTurnRequest request) {
        requireHostToken(token);
        ensureSwapModeActive();
        validateCurrentParticipant(request.getParticipantId());
        state.getImmediateStealBlocks().remove(request.getParticipantId());
        passCurrentParticipant();
        maybeAutoFinishCurrentCountry();
        persistState();
        return fullStateResponse();
    }

    public synchronized GameStateResponse endGame(String token) {
        requireHostToken(token);
        finalizeGame();
        persistState();
        return fullStateResponse();
    }

    public synchronized GameStateResponse resetGame(String token) {
        requireHostToken(token);
        resetGameState(false);
        return fullStateResponse();
    }

    public synchronized GameStateResponse finishCurrentCountrySwap(String token) {
        requireHostToken(token);
        if (state.isSwapModeActive()) {
            concludeCurrentCountryPhase();
            tryFinalizeGameIfReady();
        }
        persistState();
        return fullStateResponse();
    }

    private void beginGameIfNeeded() {
        if (!state.isGameStarted()) {
            state.setGameStarted(true);
        }
    }

    public synchronized Gift getGiftOrThrow(String giftId) {
        return state.findGift(giftId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift not found"));
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
        state.getTurnQueue().poll();
    }

    private void rotateQueueAfterSteal(String returningParticipantId) {
        if (state.isSwapModeActive()) {
            String actingParticipantId = state.getSwapQueue().poll();
            if (actingParticipantId != null) {
                state.getSwapQueue().addLast(actingParticipantId);
            }

            state.getSwapQueue().remove(returningParticipantId);
            state.getSwapQueue().addFirst(returningParticipantId);
            state.setCurrentParticipantId(returningParticipantId);
            maybeAutoFinishCurrentCountry();
        } else {
            String actingParticipantId = state.getTurnQueue().poll();
            if (actingParticipantId != null) {
                state.getTurnQueue().remove(returningParticipantId);
                state.getTurnQueue().addFirst(returningParticipantId);
                state.setCurrentParticipantId(returningParticipantId);
                updateCurrentParticipantFromGlobalQueueIfNeeded();
            }
        }
    }

    private void passCurrentParticipant() {
        if (!state.isSwapModeActive()) {
            return;
        }
        String current = state.getSwapQueue().poll();
        if (current != null) {
            state.getSwapQueue().addLast(current);
        }
        state.setCurrentParticipantId(state.getSwapQueue().peek());
    }

    private void updateCurrentParticipantFromGlobalQueueIfNeeded() {
        if (state.isSwapModeActive()) {
            return;
        }
        if (!state.getTurnQueue().isEmpty()) {
            state.setCurrentParticipantId(state.getTurnQueue().peek());
        } else {
            state.setCurrentParticipantId(null);
            tryFinalizeGameIfReady();
        }
    }

    private void ensureSwapModeActive() {
        if (!state.isSwapModeActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Swap phase has not begun yet");
        }
    }

    private void maybeAutoFinishCurrentCountry() {
        if (!state.isSwapModeActive()) {
            return;
        }
        String country = state.getCurrentCountry();
        if (country == null) {
            concludeCurrentCountryPhase();
            return;
        }
        boolean anyStealable = state.getGifts().stream()
                .filter(gift -> Objects.equals(gift.getCountry(), country))
                .anyMatch(gift -> gift.isRevealed() && gift.getWinnerParticipantId() != null && !isGiftFullyLocked(gift));
        if (!anyStealable || state.getSwapQueue().isEmpty()) {
            concludeCurrentCountryPhase();
        }
    }

    private void concludeCurrentCountryPhase() {
        String finishedCountry = state.getCurrentCountry();
        if (finishedCountry != null && !state.getCompletedCountries().contains(finishedCountry)) {
            state.getCompletedCountries().add(finishedCountry);
        }
        state.setSwapModeActive(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(true);
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
        state.getSwapQueue().clear();
        state.setCurrentCountry(null);

        while (!state.getPendingSwapCountries().isEmpty()) {
            String nextCountry = state.getPendingSwapCountries().poll();
            if (maybeStartCountrySwap(nextCountry)) {
                return;
            }
        }

        updateCurrentParticipantFromGlobalQueueIfNeeded();
        tryFinalizeGameIfReady();
    }

    private void tryFinalizeGameIfReady() {
        if (state.isSwapModeActive()) {
            return;
        }
        if (!state.getPendingSwapCountries().isEmpty()) {
            String nextCountry = state.getPendingSwapCountries().poll();
            if (maybeStartCountrySwap(nextCountry)) {
                return;
            }
        }
        boolean globalQueueEmpty = state.getTurnQueue().isEmpty();
        boolean allCountriesWrapped = state.getCountrySequence().stream()
                .allMatch(country -> state.getCompletedCountries().contains(country));
        if (globalQueueEmpty && allCountriesWrapped) {
            finalizeGame();
        }
    }

    private void finalizeGame() {
        state.setGameCompleted(true);
        state.setSwapModeActive(false);
        state.setFinalSwapAvailable(false);
        state.setFinalSwapUsed(true);
        state.getImmediateStealBlocks().clear();
        state.getGiftSwapCounts().clear();
        state.getTurnQueue().clear();
        state.getSwapQueue().clear();
        state.getPendingSwapCountries().clear();
        state.setCurrentParticipantId(null);
        state.setCurrentCountry(null);
    }
}
