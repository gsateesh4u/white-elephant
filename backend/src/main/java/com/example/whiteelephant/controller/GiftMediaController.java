package com.example.whiteelephant.controller;

import com.example.whiteelephant.model.Gift;
import com.example.whiteelephant.service.GameService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
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
import java.io.InputStream;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/gifts")
public class GiftMediaController {
    private static final Logger log = LoggerFactory.getLogger(GiftMediaController.class);
    private static final byte[] PLACEHOLDER_IMAGE = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=");

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
            if (isRemoteUrl(sourceUrl)) {
                return fetchRemoteImage(giftId, index, sourceUrl);
            }
            return loadLocalImage(sourceUrl);
        } catch (Exception ex) {
            log.warn("Unable to retrieve gift image {} for gift {}: {}", index, giftId, ex.getMessage());
            return buildPlaceholderResponse();
        }
    }

    private ResponseEntity<byte[]> buildPlaceholderResponse() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setCacheControl("max-age=60");
        return new ResponseEntity<>(PLACEHOLDER_IMAGE, headers, HttpStatus.OK);
    }

    private ResponseEntity<byte[]> readImageEntity(ClientHttpResponse response) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.putAll(response.getHeaders());
        byte[] body = StreamUtils.copyToByteArray(response.getBody());
        return new ResponseEntity<>(body, headers, response.getStatusCode());
    }

    private ResponseEntity<byte[]> fetchRemoteImage(String giftId, int index, String sourceUrl) {
        ResponseEntity<byte[]> response = restTemplate.execute(
                sourceUrl,
                HttpMethod.GET,
                request -> request.getHeaders().set(HttpHeaders.USER_AGENT, "white-elephant-proxy"),
                this::readImageEntity
        );

        if (response == null || !response.getStatusCode().is2xxSuccessful()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image unavailable for gift " + giftId + " index " + index);
        }

        MediaType mediaType = response.getHeaders().getContentType();
        byte[] body = response.getBody();
        if (body == null || body.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image unavailable for gift " + giftId + " index " + index);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType != null ? mediaType : MediaType.IMAGE_JPEG);
        headers.setCacheControl("max-age=300, public");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    private ResponseEntity<byte[]> loadLocalImage(String sourceUrl) throws IOException {
        String path = normalizeLocalPath(sourceUrl);
        Resource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }
        byte[] body;
        try (InputStream inputStream = resource.getInputStream()) {
            body = StreamUtils.copyToByteArray(inputStream);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(resolveMediaType(resource));
        headers.setCacheControl("max-age=3600, public");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    private MediaType resolveMediaType(Resource resource) {
        String filename = resource.getFilename();
        if (filename == null) {
            return MediaType.IMAGE_PNG;
        }
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (lower.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        }
        return MediaType.IMAGE_PNG;
    }

    private String normalizeLocalPath(String sourceUrl) {
        String cleaned = sourceUrl.startsWith("/") ? sourceUrl.substring(1) : sourceUrl;
        if (cleaned.startsWith("api/assets/")) {
            cleaned = cleaned.substring("api/assets/".length());
        }
        if (!cleaned.startsWith("static/") && !cleaned.startsWith("images/")) {
            cleaned = "images/" + cleaned;
        }
        if (!cleaned.startsWith("static/")) {
            cleaned = "static/" + cleaned;
        }
        return cleaned;
    }

    private boolean isRemoteUrl(String sourceUrl) {
        String lower = sourceUrl.toLowerCase(Locale.ROOT);
        return lower.startsWith("http://") || lower.startsWith("https://");
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(10).toMillis());
        return new RestTemplate(factory);
    }
}
