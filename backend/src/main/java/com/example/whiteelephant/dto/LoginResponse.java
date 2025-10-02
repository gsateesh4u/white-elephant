package com.example.whiteelephant.dto;

public class LoginResponse {
    private final String token;
    private final String hostName;

    public LoginResponse(String token, String hostName) {
        this.token = token;
        this.hostName = hostName;
    }

    public String getToken() {
        return token;
    }

    public String getHostName() {
        return hostName;
    }
}
