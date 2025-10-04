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
                              String firstParticipantId) {
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
    }

    public static GameStateResponse from(GameState state) {
        List<ParticipantView> participants = state.getParticipants().stream()
                .map(ParticipantView::from)
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
                state.getFirstParticipantId()
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

    public static class ParticipantView {
        private final String id;
        private final String name;
        private final String photoUrl;
        private final String currentGiftId;

        private ParticipantView(String id, String name, String photoUrl, String currentGiftId) {
            this.id = id;
            this.name = name;
            this.photoUrl = photoUrl;
            this.currentGiftId = currentGiftId;
        }

        public static ParticipantView from(Participant participant) {
            return new ParticipantView(
                    participant.getId(),
                    participant.getName(),
                    participant.getPhotoUrl(),
                    participant.getCurrentGiftId()
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

        public String getCurrentGiftId() {
            return currentGiftId;
        }
    }

    public static class GiftView {
        private final String id;
        private final String name;
        private final String description;
        private final String imageUrl;
        private final boolean revealed;
        private final String ownerParticipantId;
        private final int timesStolen;
        private final boolean locked;

        private GiftView(String id,
                         String name,
                         String description,
                         String imageUrl,
                         boolean revealed,
                         String ownerParticipantId,
                         int timesStolen,
                         boolean locked) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.imageUrl = imageUrl;
            this.revealed = revealed;
            this.ownerParticipantId = ownerParticipantId;
            this.timesStolen = timesStolen;
            this.locked = locked;
        }

        public static GiftView from(Gift gift) {
            return new GiftView(
                    gift.getId(),
                    gift.getName(),
                    gift.getDescription(),
                    gift.getImageUrl(),
                    gift.isRevealed(),
                    gift.getOwnerParticipantId(),
                    gift.getTimesStolen(),
                    gift.isLocked()
            );
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

        public String getImageUrl() {
            return imageUrl;
        }

        public boolean isRevealed() {
            return revealed;
        }

        public String getOwnerParticipantId() {
            return ownerParticipantId;
        }

        public int getTimesStolen() {
            return timesStolen;
        }

        public boolean isLocked() {
            return locked;
        }
    }
}

