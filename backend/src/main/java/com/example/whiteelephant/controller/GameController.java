package com.example.whiteelephant.controller;

import com.example.whiteelephant.dto.PassTurnRequest;
import com.example.whiteelephant.dto.GameStateResponse;
import com.example.whiteelephant.dto.StealRequest;
import com.example.whiteelephant.dto.UnwrapRequest;
import com.example.whiteelephant.service.GameService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/state")
    public GameStateResponse state() {
        return gameService.getState();
    }

    @PostMapping("/shuffle")
    public GameStateResponse shuffle(@RequestHeader("X-Host-Token") String token) {
        return gameService.shuffleParticipants(token);
    }

    @PostMapping("/turn/unwrap")
    public GameStateResponse unwrap(@RequestHeader("X-Host-Token") String token,
                                    @Valid @RequestBody UnwrapRequest request) {
        return gameService.unwrapGift(token, request);
    }

    @PostMapping("/turn/steal")
    public GameStateResponse steal(@RequestHeader("X-Host-Token") String token,
                                   @Valid @RequestBody StealRequest request) {
        return gameService.stealGift(token, request);
    }

    @PostMapping("/turn/pass")
    public GameStateResponse pass(@RequestHeader("X-Host-Token") String token,
                                  @Valid @RequestBody PassTurnRequest request) {
        return gameService.passTurn(token, request);
    }

    @PostMapping("/turn/end")
    public GameStateResponse end(@RequestHeader("X-Host-Token") String token) {
        return gameService.endGame(token);
    }

    @PostMapping("/swap/end")
    public GameStateResponse finishSwap(@RequestHeader("X-Host-Token") String token) {
        return gameService.finishCurrentCountrySwap(token);
    }

    @PostMapping("/reset")
    public GameStateResponse reset(@RequestHeader("X-Host-Token") String token) {
        return gameService.resetGame(token);
    }
}
