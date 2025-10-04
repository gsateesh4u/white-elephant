package com.example.whiteelephant.model;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class GameState {
    private final List<Participant> participants = new ArrayList<>();
    private final List<Gift> gifts = new ArrayList<>();
    private final Deque<String> turnQueue = new ArrayDeque<>();
    private final List<String> completedTurnOrder = new ArrayList<>();
    private final Map<String, String> immediateStealBlocks = new HashMap<>();
    private boolean gameStarted;
    private boolean gameCompleted;
    private boolean finalSwapAvailable;
    private boolean finalSwapUsed;
    private boolean swapModeActive;
    private String firstParticipantId;
    private String currentParticipantId;

    public List<Participant> getParticipants() {
        return participants;
    }

    public List<Gift> getGifts() {
        return gifts;
    }

    public Deque<String> getTurnQueue() {
        return turnQueue;
    }

    public List<String> getCompletedTurnOrder() {
        return completedTurnOrder;
    }

    public Map<String, String> getImmediateStealBlocks() {
        return immediateStealBlocks;
    }

    public boolean isGameStarted() {
        return gameStarted;
    }

    public void setGameStarted(boolean gameStarted) {
        this.gameStarted = gameStarted;
    }

    public boolean isGameCompleted() {
        return gameCompleted;
    }

    public void setGameCompleted(boolean gameCompleted) {
        this.gameCompleted = gameCompleted;
    }

    public boolean isFinalSwapAvailable() {
        return finalSwapAvailable;
    }

    public void setFinalSwapAvailable(boolean finalSwapAvailable) {
        this.finalSwapAvailable = finalSwapAvailable;
    }

    public boolean isFinalSwapUsed() {
        return finalSwapUsed;
    }

    public void setFinalSwapUsed(boolean finalSwapUsed) {
        this.finalSwapUsed = finalSwapUsed;
    }

    public boolean isSwapModeActive() {
        return swapModeActive;
    }

    public void setSwapModeActive(boolean swapModeActive) {
        this.swapModeActive = swapModeActive;
    }

    public String getFirstParticipantId() {
        return firstParticipantId;
    }

    public void setFirstParticipantId(String firstParticipantId) {
        this.firstParticipantId = firstParticipantId;
    }

    public String getCurrentParticipantId() {
        return currentParticipantId;
    }

    public void setCurrentParticipantId(String currentParticipantId) {
        this.currentParticipantId = currentParticipantId;
    }

    public Optional<Participant> findParticipant(String participantId) {
        return participants.stream().filter(p -> p.getId().equals(participantId)).findFirst();
    }

    public Optional<Gift> findGift(String giftId) {
        return gifts.stream().filter(g -> g.getId().equals(giftId)).findFirst();
    }
}
