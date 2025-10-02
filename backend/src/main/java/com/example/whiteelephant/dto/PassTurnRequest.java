package com.example.whiteelephant.dto;

import jakarta.validation.constraints.NotBlank;

public class PassTurnRequest {
    @NotBlank
    private String participantId;

    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }
}
