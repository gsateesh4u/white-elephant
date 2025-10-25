package com.example.whiteelephant.model;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class Gift {
    private final String id;
    private final String name;
    private final String description;
    private final String url;
    private final List<String> imageUrls;
    private final String originalOwnerParticipantId;
    private final String country;
    private String winnerParticipantId;
    private boolean revealed;
    private int timesStolen;

    public Gift(String id,
                String name,
                String description,
                String url,
                List<String> imageUrls,
                String originalOwnerParticipantId,
                String country) {
        this.id = Objects.requireNonNull(id, "id");
        this.name = Objects.requireNonNull(name, "name");
        this.description = Objects.requireNonNull(description, "description");
        this.url = Objects.requireNonNull(url, "url");
        this.imageUrls = imageUrls == null || imageUrls.isEmpty()
                ? List.of()
                : List.copyOf(imageUrls);
        this.originalOwnerParticipantId = Objects.requireNonNull(originalOwnerParticipantId, "originalOwnerParticipantId");
        this.country = Objects.requireNonNull(country, "country");
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
        return Collections.unmodifiableList(imageUrls);
    }

    public String getPrimaryImageUrl() {
        return imageUrls.isEmpty() ? null : imageUrls.get(0);
    }

    public String getCountry() {
        return country;
    }

    public String getOriginalOwnerParticipantId() {
        return originalOwnerParticipantId;
    }

    public String getWinnerParticipantId() {
        return winnerParticipantId;
    }

    public String getOwnerParticipantId() {
        return getWinnerParticipantId();
    }

    public void setWinnerParticipantId(String winnerParticipantId) {
        this.winnerParticipantId = winnerParticipantId;
    }

    public void setOwnerParticipantId(String ownerParticipantId) {
        setWinnerParticipantId(ownerParticipantId);
    }

    public boolean isRevealed() {
        return revealed;
    }

    public void setRevealed(boolean revealed) {
        this.revealed = revealed;
    }

    public int getTimesStolen() {
        return timesStolen;
    }

    public void incrementTimesStolen() {
        this.timesStolen++;
    }

    public boolean isLocked() {
        return timesStolen >= 2;
    }
}
