package com.example.whiteelephant.dto;

import jakarta.validation.constraints.NotBlank;

public class FinalSwapRequest {
    @NotBlank
    private String participantId;

    @NotBlank
    private String targetGiftId;

    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }

    public String getTargetGiftId() {
        return targetGiftId;
    }

    public void setTargetGiftId(String targetGiftId) {
        this.targetGiftId = targetGiftId;
    }
}
