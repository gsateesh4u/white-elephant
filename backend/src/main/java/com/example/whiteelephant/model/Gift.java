package com.example.whiteelephant.model;

public class Gift {
    private final String id;
    private final String name;
    private final String description;
    private final String imageUrl;
    private final String originalOwnerParticipantId;
    private final String country;
    private String ownerParticipantId;
    private boolean revealed;
    private int timesStolen;

    public Gift(String id, String name, String description, String imageUrl, String originalOwnerParticipantId, String country) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.originalOwnerParticipantId = originalOwnerParticipantId;
        this.country = country;
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

    public String getCountry() {
        return country;
    }

    public String getOriginalOwnerParticipantId() {
        return originalOwnerParticipantId;
    }

    public String getOwnerParticipantId() {
        return ownerParticipantId;
    }

    public void setOwnerParticipantId(String ownerParticipantId) {
        this.ownerParticipantId = ownerParticipantId;
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
