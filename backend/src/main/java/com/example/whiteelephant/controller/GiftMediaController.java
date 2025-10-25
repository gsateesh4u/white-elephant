package com.example.whiteelephant.controller;

import com.example.whiteelephant.model.Gift;
import com.example.whiteelephant.service.GameService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/gifts")
public class GiftMediaController {
    private final GameService gameService;
    private final RestTemplate restTemplate;

    public GiftMediaController(GameService gameService) {
        this.gameService = gameService;
        this.restTemplate = buildRestTemplate();
    }

    @GetMapping("/{giftId}/images/{index}")
    public ResponseEntity<byte[]> proxyGiftImage(@PathVariable String giftId, @PathVariable int index) {
        Gift gift = gameService.getGiftOrThrow(giftId);
        if (!gift.isRevealed()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Gift image not available until it is unwrapped");
        }

        List<String> imageUrls = gift.getImageUrls();
        if (imageUrls == null || index < 0 || index >= imageUrls.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }

        String sourceUrl = imageUrls.get(index);
        try {
            ResponseEntity<byte[]> response = restTemplate.execute(
                    sourceUrl,
                    HttpMethod.GET,
                    request -> request.getHeaders().set(HttpHeaders.USER_AGENT, "white-elephant-proxy"),
                    this::readImageEntity
            );

            if (response == null || !response.getStatusCode().is2xxSuccessful()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image unavailable");
            }

            MediaType mediaType = response.getHeaders().getContentType();
            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image unavailable");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType != null ? mediaType : MediaType.IMAGE_JPEG);
            headers.setCacheControl("max-age=120");

            return new ResponseEntity<>(body, headers, HttpStatus.OK);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to retrieve gift image", ex);
        }
    }

    private ResponseEntity<byte[]> readImageEntity(ClientHttpResponse response) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.putAll(response.getHeaders());
        byte[] body = StreamUtils.copyToByteArray(response.getBody());
        return new ResponseEntity<>(body, headers, response.getStatusCode());
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(10).toMillis());
        return new RestTemplate(factory);
    }
}
