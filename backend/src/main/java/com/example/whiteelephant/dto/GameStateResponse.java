package com.example.whiteelephant.dto;

import com.example.whiteelephant.model.GameState;
import com.example.whiteelephant.model.Gift;
import com.example.whiteelephant.model.Participant;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class GameStateResponse {
    private final List<ParticipantView> participants;
    private final List<GiftView> gifts;
    private final List<String> upcomingTurnOrder;
    private final List<String> completedTurnOrder;
    private final Map<String, String> immediateStealBlocks;
    private final String currentParticipantId;
    private final boolean gameStarted;
    private final boolean gameCompleted;
    private final boolean finalSwapAvailable;
    private final boolean finalSwapUsed;
    private final boolean swapModeActive;
    private final String firstParticipantId;
    private final List<String> countrySequence;
    private final List<String> completedCountries;
    private final String currentCountry;

    private GameStateResponse(List<ParticipantView> participants,
                              List<GiftView> gifts,
                              List<String> upcomingTurnOrder,
                              List<String> completedTurnOrder,
                              Map<String, String> immediateStealBlocks,
                              String currentParticipantId,
                              boolean gameStarted,
                              boolean gameCompleted,
                              boolean finalSwapAvailable,
                              boolean finalSwapUsed,
                              boolean swapModeActive,
                              String firstParticipantId,
                              List<String> countrySequence,
                              List<String> completedCountries,
                              String currentCountry) {
        this.participants = participants;
        this.gifts = gifts;
        this.upcomingTurnOrder = upcomingTurnOrder;
        this.completedTurnOrder = completedTurnOrder;
        this.immediateStealBlocks = immediateStealBlocks;
        this.currentParticipantId = currentParticipantId;
        this.gameStarted = gameStarted;
        this.gameCompleted = gameCompleted;
        this.finalSwapAvailable = finalSwapAvailable;
        this.finalSwapUsed = finalSwapUsed;
        this.swapModeActive = swapModeActive;
        this.firstParticipantId = firstParticipantId;
        this.countrySequence = countrySequence;
        this.completedCountries = completedCountries;
        this.currentCountry = currentCountry;
    }

    public static GameStateResponse from(GameState state) {
        List<Participant> participantEntities = state.getParticipants();
        List<ParticipantView> participants = java.util.stream.IntStream
                .range(0, participantEntities.size())
                .mapToObj(index -> ParticipantView.from(participantEntities.get(index), index + 1))
                .collect(Collectors.toList());

        List<GiftView> gifts = state.getGifts().stream()
                .map(GiftView::from)
                .collect(Collectors.toList());

        List<String> upcoming = state.getTurnQueue().stream().collect(Collectors.toList());
        List<String> completed = List.copyOf(state.getCompletedTurnOrder());
        Map<String, String> blocks = Map.copyOf(state.getImmediateStealBlocks());

        return new GameStateResponse(
                participants,
                gifts,
                upcoming,
                completed,
                blocks,
                state.getCurrentParticipantId(),
                state.isGameStarted(),
                state.isGameCompleted(),
                state.isFinalSwapAvailable(),
                state.isFinalSwapUsed(),
                state.isSwapModeActive(),
                state.getFirstParticipantId(),
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

        public static ParticipantView from(Participant participant, int playOrder) {
            return new ParticipantView(
                    participant.getId(),
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
        private final String country;
        private final int timesStolen;
        private final boolean locked;

        private GiftView(String id,
                         String name,
                         String description,
                         String url,
                         List<String> imageUrls,
                         String imageUrl,
                         boolean revealed,
                         String originalOwnerParticipantId,
                         String winnerParticipantId,
                         String country,
                         int timesStolen,
                         boolean locked) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.url = url;
            this.imageUrls = imageUrls;
            this.imageUrl = imageUrl;
            this.revealed = revealed;
            this.originalOwnerParticipantId = originalOwnerParticipantId;
            this.winnerParticipantId = winnerParticipantId;
            this.country = country;
            this.timesStolen = timesStolen;
            this.locked = locked;
        }

        public static GiftView from(Gift gift) {
            List<String> proxyImageUrls = buildProxyUrls(gift);
            String primaryProxyUrl = proxyImageUrls.isEmpty() ? null : proxyImageUrls.get(0);

            return new GiftView(
                    gift.getId(),
                    gift.getName(),
                    gift.getDescription(),
                    gift.getUrl(),
                    proxyImageUrls,
                    primaryProxyUrl,
                    gift.isRevealed(),
                    gift.getOriginalOwnerParticipantId(),
                    gift.getWinnerParticipantId(),
                    gift.getCountry(),
                    gift.getTimesStolen(),
                    gift.isLocked()
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

    }
}

