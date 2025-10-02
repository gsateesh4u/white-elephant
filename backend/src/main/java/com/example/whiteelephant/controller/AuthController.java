package com.example.whiteelephant.controller;

import com.example.whiteelephant.dto.LoginRequest;
import com.example.whiteelephant.dto.LoginResponse;
import com.example.whiteelephant.service.GameService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/host")
public class AuthController {
    private final GameService gameService;

    public AuthController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return gameService.login(request.getUsername(), request.getPassword());
    }
}
