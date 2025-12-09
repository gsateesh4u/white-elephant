package com.example.whiteelephant.dto;

import com.example.whiteelephant.model.GameState;
import com.example.whiteelephant.model.Gift;
import com.example.whiteelephant.model.Participant;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public class GameStateResponse {
    private final List<ParticipantView> participants;
    private final List<GiftView> gifts;
    private final List<String> upcomingTurnOrder;
    private final List<String> completedTurnOrder;
    private final Map<String, String> immediateStealBlocks;
    private final String currentParticipantId;
    private final String currentParticipantName;
    private final boolean gameStarted;
    private final boolean gameCompleted;
    private final boolean finalSwapAvailable;
    private final boolean finalSwapUsed;
    private final boolean swapModeActive;
    private final String firstParticipantId;
    private final String firstParticipantName;
    private final List<String> upcomingParticipantNames;
    private final String requestingParticipantName;
    private final List<String> countrySequence;
    private final List<String> completedCountries;
    private final String currentCountry;

    private GameStateResponse(List<ParticipantView> participants,
                              List<GiftView> gifts,
                              List<String> upcomingTurnOrder,
                              List<String> completedTurnOrder,
                              Map<String, String> immediateStealBlocks,
                              String currentParticipantId,
                              String currentParticipantName,
                              boolean gameStarted,
                              boolean gameCompleted,
                              boolean finalSwapAvailable,
                              boolean finalSwapUsed,
                              boolean swapModeActive,
                              String firstParticipantId,
                              String firstParticipantName,
                              List<String> upcomingParticipantNames,
                              String requestingParticipantName,
                              List<String> countrySequence,
                              List<String> completedCountries,
                              String currentCountry) {
        this.participants = participants;
        this.gifts = gifts;
        this.upcomingTurnOrder = upcomingTurnOrder;
        this.completedTurnOrder = completedTurnOrder;
        this.immediateStealBlocks = immediateStealBlocks;
        this.currentParticipantId = currentParticipantId;
        this.currentParticipantName = currentParticipantName;
        this.gameStarted = gameStarted;
        this.gameCompleted = gameCompleted;
        this.finalSwapAvailable = finalSwapAvailable;
        this.finalSwapUsed = finalSwapUsed;
        this.swapModeActive = swapModeActive;
        this.firstParticipantId = firstParticipantId;
        this.firstParticipantName = firstParticipantName;
        this.upcomingParticipantNames = upcomingParticipantNames;
        this.requestingParticipantName = requestingParticipantName;
        this.countrySequence = countrySequence;
        this.completedCountries = completedCountries;
        this.currentCountry = currentCountry;
    }

    public static GameStateResponse from(GameState state, boolean includeSensitiveDetails, String privilegedParticipantId) {
        List<Participant> participantEntities = state.getParticipants();
        List<ParticipantView> participants = java.util.stream.IntStream
                .range(0, participantEntities.size())
                .mapToObj(index -> ParticipantView.from(participantEntities.get(index), index + 1, includeSensitiveDetails))
                .collect(Collectors.toList());

        Map<String, Participant> participantById = state.getParticipants().stream()
                .collect(Collectors.toMap(Participant::getId, participant -> participant));

        List<GiftView> gifts = state.getGifts().stream()
                .map(gift -> GiftView.from(gift, includeSensitiveDetails, privilegedParticipantId, participantById))
                .collect(Collectors.toList());

        String rawCurrentParticipantId = state.getCurrentParticipantId();
        String currentParticipantId = includeSensitiveDetails ? rawCurrentParticipantId : null;
        String currentParticipantName = rawCurrentParticipantId != null && participantById.get(rawCurrentParticipantId) != null
                ? participantById.get(rawCurrentParticipantId).getName()
                : null;
        String rawFirstParticipantId = state.getFirstParticipantId();
        String firstParticipantId = includeSensitiveDetails ? rawFirstParticipantId : null;
        String firstParticipantName = rawFirstParticipantId != null && participantById.get(rawFirstParticipantId) != null
                ? participantById.get(rawFirstParticipantId).getName()
                : null;

        List<String> upcomingParticipantNames = state.getTurnQueue().stream()
                .map(participantById::get)
                .filter(Objects::nonNull)
                .map(Participant::getName)
                .collect(Collectors.toList());

        Participant requestingParticipant = privilegedParticipantId != null
                ? participantById.get(privilegedParticipantId)
                : null;
        String requestingParticipantName = requestingParticipant != null ? requestingParticipant.getName() : null;

        List<String> upcoming = includeSensitiveDetails
                ? state.getTurnQueue().stream().collect(Collectors.toList())
                : List.of();
        List<String> completed = includeSensitiveDetails ? List.copyOf(state.getCompletedTurnOrder()) : List.of();
        Map<String, String> blocks = includeSensitiveDetails
                ? Map.copyOf(state.getImmediateStealBlocks())
                : Map.of();

        return new GameStateResponse(
                participants,
                gifts,
                upcoming,
                completed,
                blocks,
                currentParticipantId,
                currentParticipantName,
                state.isGameStarted(),
                state.isGameCompleted(),
                state.isFinalSwapAvailable(),
                state.isFinalSwapUsed(),
                state.isSwapModeActive(),
                firstParticipantId,
                firstParticipantName,
                upcomingParticipantNames,
                requestingParticipantName,
                List.copyOf(state.getCountrySequence()),
                List.copyOf(state.getCompletedCountries()),
                state.getCurrentCountry()
        );
    }

    public List<ParticipantView> getParticipants() {
        return participants;
    }

    public List<GiftView> getGifts() {
        return gifts;
    }

    public List<String> getUpcomingTurnOrder() {
        return upcomingTurnOrder;
    }

    public List<String> getCompletedTurnOrder() {
        return completedTurnOrder;
    }

    public Map<String, String> getImmediateStealBlocks() {
        return immediateStealBlocks;
    }

    public String getCurrentParticipantId() {
        return currentParticipantId;
    }

    public String getCurrentParticipantName() {
        return currentParticipantName;
    }

    public boolean isGameStarted() {
        return gameStarted;
    }

    public boolean isGameCompleted() {
        return gameCompleted;
    }

    public boolean isFinalSwapAvailable() {
        return finalSwapAvailable;
    }

    public boolean isFinalSwapUsed() {
        return finalSwapUsed;
    }

    public boolean isSwapModeActive() {
        return swapModeActive;
    }

    public String getFirstParticipantId() {
        return firstParticipantId;
    }

    public String getFirstParticipantName() {
        return firstParticipantName;
    }

    public List<String> getUpcomingParticipantNames() {
        return upcomingParticipantNames;
    }

    public String getRequestingParticipantName() {
        return requestingParticipantName;
    }

    public List<String> getCountrySequence() {
        return countrySequence;
    }

    public List<String> getCompletedCountries() {
        return completedCountries;
    }

    public String getCurrentCountry() {
        return currentCountry;
    }

    public static class ParticipantView {
        private final String id;
        private final String name;
        private final String photoUrl;
        private final String country;
        private final String currentGiftId;
        private final int playOrder;

        private ParticipantView(String id, String name, String photoUrl, String country, String currentGiftId, int playOrder) {
            this.id = id;
            this.name = name;
            this.photoUrl = photoUrl;
            this.country = country;
            this.currentGiftId = currentGiftId;
            this.playOrder = playOrder;
        }

        public static ParticipantView from(Participant participant, int playOrder, boolean includeSensitiveDetails) {
            return new ParticipantView(
                    includeSensitiveDetails ? participant.getId() : null,
                    participant.getName(),
                    participant.getPhotoUrl(),
                    participant.getCountry(),
                    participant.getCurrentGiftId(),
                    playOrder
            );
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getPhotoUrl() {
            return photoUrl;
        }

        public String getCountry() {
            return country;
        }

        public String getCurrentGiftId() {
            return currentGiftId;
        }

        public int getPlayOrder() {
            return playOrder;
        }
    }

    public static class GiftView {
        private final String id;
        private final String name;
        private final String description;
        private final String url;
        private final List<String> imageUrls;
        private final String imageUrl;
        private final boolean revealed;
        private final String originalOwnerParticipantId;
        private final String winnerParticipantId;
        private final String winnerParticipantName;
        private final String winnerParticipantCountry;
        private final String country;
        private final int timesStolen;
        private final boolean locked;
        private final boolean ownedByRequester;

        private GiftView(String id,
                         String name,
                         String description,
                         String url,
                         List<String> imageUrls,
                         String imageUrl,
                         boolean revealed,
                         String originalOwnerParticipantId,
                         String winnerParticipantId,
                         String winnerParticipantName,
                         String winnerParticipantCountry,
                         String country,
                         int timesStolen,
                         boolean locked,
                         boolean ownedByRequester) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.url = url;
            this.imageUrls = imageUrls;
            this.imageUrl = imageUrl;
            this.revealed = revealed;
            this.originalOwnerParticipantId = originalOwnerParticipantId;
            this.winnerParticipantId = winnerParticipantId;
            this.winnerParticipantName = winnerParticipantName;
            this.winnerParticipantCountry = winnerParticipantCountry;
            this.country = country;
            this.timesStolen = timesStolen;
            this.locked = locked;
            this.ownedByRequester = ownedByRequester;
        }

        public static GiftView from(Gift gift, boolean includeSensitiveDetails, String privilegedParticipantId, Map<String, Participant> participantById) {
            boolean showDetails = includeSensitiveDetails || gift.isRevealed();
            String originalOwnerParticipantId = gift.getOriginalOwnerParticipantId();
            boolean showOriginalOwner = includeSensitiveDetails || Objects.equals(originalOwnerParticipantId, privilegedParticipantId);
            List<String> proxyImageUrls = showDetails ? buildProxyUrls(gift) : List.of();
            String primaryProxyUrl = proxyImageUrls.isEmpty() ? null : proxyImageUrls.get(0);
            boolean ownedByRequester = Objects.equals(originalOwnerParticipantId, privilegedParticipantId);
            String winnerParticipantId = gift.isRevealed() ? gift.getWinnerParticipantId() : null;
            String winnerParticipantName = null;
            String winnerParticipantCountry = null;
            Participant winner = winnerParticipantId != null ? participantById.get(winnerParticipantId) : null;
            if (winner != null) {
                winnerParticipantName = winner.getName();
                winnerParticipantCountry = winner.getCountry();
            }
            String exposedWinnerId = includeSensitiveDetails ? winnerParticipantId : null;

            return new GiftView(
                    gift.getId(),
                    showDetails ? gift.getName() : null,
                    showDetails ? gift.getDescription() : null,
                    showDetails ? gift.getUrl() : null,
                    proxyImageUrls,
                    primaryProxyUrl,
                    gift.isRevealed(),
                    showOriginalOwner ? originalOwnerParticipantId : null,
                    exposedWinnerId,
                    winnerParticipantName,
                    winnerParticipantCountry,
                    gift.getCountry(),
                    gift.getTimesStolen(),
                    gift.isLocked(),
                    ownedByRequester
            );
        }

        private static List<String> buildProxyUrls(Gift gift) {
            List<String> originals = gift.getImageUrls();
            if (originals == null || originals.isEmpty()) {
                return List.of();
            }
            String giftId = gift.getId();
            return java.util.stream.IntStream.range(0, originals.size())
                    .mapToObj(index -> "/api/gifts/" + giftId + "/images/" + index)
                    .collect(java.util.stream.Collectors.toList());
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public String getUrl() {
            return url;
        }

        public List<String> getImageUrls() {
            return imageUrls;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public boolean isRevealed() {
            return revealed;
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        public String getOriginalOwnerParticipantId() {
            return originalOwnerParticipantId;
        }

        public String getWinnerParticipantId() {
            return winnerParticipantId;
        }

        public String getCountry() {
            return country;
        }

        public int getTimesStolen() {
            return timesStolen;
        }

        public boolean isLocked() {
            return locked;
        }

        public String getWinnerParticipantName() {
            return winnerParticipantName;
        }

        public String getWinnerParticipantCountry() {
            return winnerParticipantCountry;
        }

        public boolean isOwnedByRequester() {
            return ownedByRequester;
        }

    }
}

