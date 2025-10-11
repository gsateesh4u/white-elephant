package com.example.whiteelephant.model;

import java.util.Objects;

public class Participant {
    private final String id;
    private final String name;
    private final String photoUrl;
    private final String country;
    private String currentGiftId;

    public Participant(String id, String name, String photoUrl, String country) {
        this.id = id;
        this.name = name;
        this.photoUrl = photoUrl;
        this.country = country;
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

    public void setCurrentGiftId(String currentGiftId) {
        this.currentGiftId = currentGiftId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Participant that = (Participant) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
