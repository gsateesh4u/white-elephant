package com.example.whiteelephant.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards client-side routes (like the participant view) to the SPA's entry point when running from the packaged jar.
 */
@Controller
public class SpaController {
    @GetMapping("/ParticipantView")
    public String participantView() {
        return "forward:/index.html";
    }
}
