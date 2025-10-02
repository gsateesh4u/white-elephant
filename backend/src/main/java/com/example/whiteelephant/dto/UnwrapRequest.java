package com.example.whiteelephant.dto;

import jakarta.validation.constraints.NotBlank;

public class UnwrapRequest {
    @NotBlank
    private String participantId;

    @NotBlank
    private String giftId;

    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }

    public String getGiftId() {
        return giftId;
    }

    public void setGiftId(String giftId) {
        this.giftId = giftId;
    }
}
