package com.example.whiteelephant.service;

import com.example.whiteelephant.model.GameState;
import com.example.whiteelephant.model.Gift;
import com.example.whiteelephant.model.Participant;
import com.healthmarketscience.jackcess.ColumnBuilder;
import com.healthmarketscience.jackcess.Cursor;
import com.healthmarketscience.jackcess.CursorBuilder;
import com.healthmarketscience.jackcess.DataType;
import com.healthmarketscience.jackcess.Database;
import com.healthmarketscience.jackcess.DatabaseBuilder;
import com.healthmarketscience.jackcess.Row;
import com.healthmarketscience.jackcess.Table;
import com.healthmarketscience.jackcess.TableBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class AccessDatabaseService {
    private static final Logger log = LoggerFactory.getLogger(AccessDatabaseService.class);
    private static final String PARTICIPANTS_TABLE = "participants";
    private static final String GIFTS_TABLE = "gifts";
    private static final String GAME_STATE_TABLE = "game_state";
    private static final String GAME_STATE_ROW_ID = "white-elephant-state";

    private final Path databasePath;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AccessDatabaseService(
            @Value("${whiteelephant.access-db-path:./data/white-elephant.accdb}") String dbPath) {
        this.databasePath = Paths.get(dbPath).toAbsolutePath();
    }

    @PostConstruct
    public void initialize() {
        try {
            Path parent = databasePath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            if (Files.notExists(databasePath)) {
                try (Database database = DatabaseBuilder
                        .create(Database.FileFormat.V2010, databasePath.toFile())) {
                    createParticipantsTable(database);
                    createGiftsTable(database);
                    createGameStateTable(database);
                }
                log.info("Created Access database at {}", databasePath);
            } else {
                try (Database database = openDatabase()) {
                    ensureTable(database, PARTICIPANTS_TABLE, this::createParticipantsTable);
                    ensureTable(database, GIFTS_TABLE, this::createGiftsTable);
                    ensureTable(database, GAME_STATE_TABLE, this::createGameStateTable);
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to initialize Access database", ex);
        }
    }

    public List<Participant> loadParticipants() {
        try (Database database = openDatabase()) {
            Table table = database.getTable(PARTICIPANTS_TABLE);
            if (table == null) {
                return List.of();
            }
            List<Participant> participants = new ArrayList<>();
            for (Row row : table) {
                participants.add(new Participant(
                        stringValue(row, "id"),
                        stringValue(row, "name"),
                        stringValue(row, "photo_url"),
                        stringValue(row, "country")));
            }
            return participants;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read participants from Access database", ex);
        }
    }

    public List<Gift> loadGifts() {
        try (Database database = openDatabase()) {
            Table table = database.getTable(GIFTS_TABLE);
            if (table == null) {
                return List.of();
            }
            List<Gift> gifts = new ArrayList<>();
            for (Row row : table) {
                gifts.add(new Gift(
                        stringValue(row, "id"),
                        stringValue(row, "name"),
                        stringValue(row, "description"),
                        stringValue(row, "url"),
                        parseImageUrls(stringValue(row, "image_urls")),
                        stringValue(row, "original_owner_id"),
                        stringValue(row, "country")));
            }
            return gifts;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read gifts from Access database", ex);
        }
    }

    public void replaceParticipants(List<Participant> participants) {
        writeRows(PARTICIPANTS_TABLE, table -> {
            clearTable(table);
            for (Participant participant : participants) {
                table.addRow(
                        participant.getId(),
                        participant.getName(),
                        participant.getPhotoUrl(),
                        participant.getCountry());
            }
        });
    }

    public void replaceGifts(List<Gift> gifts) {
        writeRows(GIFTS_TABLE, table -> {
            clearTable(table);
            for (Gift gift : gifts) {
                table.addRow(
                        gift.getId(),
                        gift.getName(),
                        gift.getDescription(),
                        gift.getUrl(),
                        serializeImageUrls(gift.getImageUrls()),
                        gift.getOriginalOwnerParticipantId(),
                        gift.getCountry());
            }
        });
    }

    private void writeRows(String tableName, CheckedConsumer<Table> writer) {
        try (Database database = openDatabase()) {
            Table table = database.getTable(tableName);
            if (table == null) {
                throw new IllegalStateException("Missing table: " + tableName);
            }
            writer.accept(table);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to write to Access table " + tableName, ex);
        }
    }

    public Optional<GameState> loadPersistedState() {
        try (Database database = openDatabase()) {
            Table table = database.getTable(GAME_STATE_TABLE);
            if (table == null) {
                return Optional.empty();
            }
            for (Row row : table) {
                String id = stringValue(row, "id");
                if (GAME_STATE_ROW_ID.equals(id)) {
                    String payload = stringValue(row, "payload");
                    if (payload == null || payload.isBlank()) {
                        return Optional.empty();
                    }
                    GameStateSnapshot snapshot = objectMapper.readValue(payload, GameStateSnapshot.class);
                    return Optional.of(snapshot.toGameState());
                }
            }
            return Optional.empty();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read game state from Access database", ex);
        }
    }

    public void saveGameState(GameState state) {
        GameStateSnapshot snapshot = GameStateSnapshot.from(state);
        try {
            String payload = objectMapper.writeValueAsString(snapshot);
            writeRows(GAME_STATE_TABLE, table -> {
                clearTable(table);
                table.addRow(GAME_STATE_ROW_ID, payload);
            });
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to persist game state to Access database", ex);
        }
    }

    private void clearTable(Table table) throws IOException {
        Cursor cursor = CursorBuilder.createCursor(table);
        while (cursor.moveToNextRow()) {
            cursor.deleteCurrentRow();
        }
    }

    private String serializeImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return "";
        }
        return imageUrls.stream()
                .filter(url -> url != null && !url.isBlank())
                .map(String::trim)
                .collect(Collectors.joining("|"));
    }

    private List<String> parseImageUrls(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split("\\|"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toUnmodifiableList());
    }

    private void ensureTable(Database database,
                             String tableName,
                             CheckedConsumer<Database> creator) throws IOException {
        if (!tableExists(database, tableName)) {
            creator.accept(database);
        }
    }

    private boolean tableExists(Database database, String tableName) throws IOException {
        return database.getTableNames()
                .stream()
                .anyMatch(name -> name.equalsIgnoreCase(tableName));
    }

    private Database openDatabase() throws IOException {
        return DatabaseBuilder.open(databasePath.toFile());
    }

    private void createParticipantsTable(Database database) throws IOException {
        new TableBuilder(PARTICIPANTS_TABLE)
                .addColumn(new ColumnBuilder("id").setType(DataType.TEXT).setLength(64))
                .addColumn(new ColumnBuilder("name").setType(DataType.TEXT).setLength(255))
                .addColumn(new ColumnBuilder("photo_url").setType(DataType.TEXT).setLength(510))
                .addColumn(new ColumnBuilder("country").setType(DataType.TEXT).setLength(32))
                .toTable(database);
    }

    private void createGiftsTable(Database database) throws IOException {
        new TableBuilder(GIFTS_TABLE)
                .addColumn(new ColumnBuilder("id").setType(DataType.TEXT).setLength(64))
                .addColumn(new ColumnBuilder("name").setType(DataType.TEXT).setLength(255))
                .addColumn(new ColumnBuilder("description").setType(DataType.MEMO))
                .addColumn(new ColumnBuilder("url").setType(DataType.MEMO))
                .addColumn(new ColumnBuilder("image_urls").setType(DataType.MEMO))
                .addColumn(new ColumnBuilder("original_owner_id").setType(DataType.TEXT).setLength(64))
                .addColumn(new ColumnBuilder("country").setType(DataType.TEXT).setLength(32))
                .toTable(database);
    }

    private void createGameStateTable(Database database) throws IOException {
        new TableBuilder(GAME_STATE_TABLE)
                .addColumn(new ColumnBuilder("id").setType(DataType.TEXT).setLength(64))
                .addColumn(new ColumnBuilder("payload").setType(DataType.MEMO))
                .toTable(database);
    }

    private String stringValue(Row row, String column) {
        Object value = row.get(column);
        return value == null ? null : value.toString();
    }

    private record GameStateSnapshot(
            List<ParticipantSnapshot> participants,
            List<GiftSnapshot> gifts,
            List<String> countrySequence,
            List<String> completedCountries,
            List<String> completedTurnOrder,
            List<String> turnQueue,
            List<String> swapQueue,
            List<String> pendingSwapCountries,
            Map<String, String> immediateStealBlocks,
            Map<String, Integer> giftSwapCounts,
            boolean gameStarted,
            boolean gameCompleted,
            boolean finalSwapAvailable,
            boolean finalSwapUsed,
            boolean swapModeActive,
            String firstParticipantId,
            String currentParticipantId,
            String currentCountry) {

        static GameStateSnapshot from(GameState state) {
            List<ParticipantSnapshot> participants = state.getParticipants().stream()
                    .map(ParticipantSnapshot::from)
                    .collect(Collectors.toList());
            List<GiftSnapshot> gifts = state.getGifts().stream()
                    .map(GiftSnapshot::from)
                    .collect(Collectors.toList());
            List<String> countrySequence = List.copyOf(state.getCountrySequence());
            List<String> completedCountries = List.copyOf(state.getCompletedCountries());
            List<String> completedTurnOrder = List.copyOf(state.getCompletedTurnOrder());
            List<String> turnQueue = new ArrayList<>(state.getTurnQueue());
            List<String> swapQueue = new ArrayList<>(state.getSwapQueue());
            List<String> pendingSwapCountries = new ArrayList<>(state.getPendingSwapCountries());
            Map<String, String> immediateStealBlocks = new LinkedHashMap<>(state.getImmediateStealBlocks());
            Map<String, Integer> giftSwapCounts = new LinkedHashMap<>(state.getGiftSwapCounts());

            return new GameStateSnapshot(
                    participants,
                    gifts,
                    countrySequence,
                    completedCountries,
                    completedTurnOrder,
                    turnQueue,
                    swapQueue,
                    pendingSwapCountries,
                    immediateStealBlocks,
                    giftSwapCounts,
                    state.isGameStarted(),
                    state.isGameCompleted(),
                    state.isFinalSwapAvailable(),
                    state.isFinalSwapUsed(),
                    state.isSwapModeActive(),
                    state.getFirstParticipantId(),
                    state.getCurrentParticipantId(),
                    state.getCurrentCountry()
            );
        }

        GameState toGameState() {
            GameState state = new GameState();
            listOrEmpty(participants).stream()
                    .map(ParticipantSnapshot::toDomain)
                    .forEach(state.getParticipants()::add);

            listOrEmpty(gifts).stream()
                    .map(GiftSnapshot::toDomain)
                    .forEach(state.getGifts()::add);

            state.getCountrySequence().addAll(listOrEmpty(countrySequence));
            state.getCompletedCountries().addAll(listOrEmpty(completedCountries));
            state.getCompletedTurnOrder().addAll(listOrEmpty(completedTurnOrder));

            listOrEmpty(turnQueue).forEach(state.getTurnQueue()::add);
            listOrEmpty(swapQueue).forEach(state.getSwapQueue()::add);
            listOrEmpty(pendingSwapCountries).forEach(state.getPendingSwapCountries()::add);

            state.getImmediateStealBlocks().putAll(mapOrEmpty(immediateStealBlocks));
            state.getGiftSwapCounts().putAll(mapOrEmpty(giftSwapCounts));

            state.setGameStarted(gameStarted);
            state.setGameCompleted(gameCompleted);
            state.setFinalSwapAvailable(finalSwapAvailable);
            state.setFinalSwapUsed(finalSwapUsed);
            state.setSwapModeActive(swapModeActive);
            state.setFirstParticipantId(firstParticipantId);
            state.setCurrentParticipantId(currentParticipantId);
            state.setCurrentCountry(currentCountry);
            return state;
        }

        private static <T> List<T> listOrEmpty(List<T> value) {
            return value == null ? List.of() : value;
        }

        private static <K, V> Map<K, V> mapOrEmpty(Map<K, V> value) {
            return value == null ? Map.of() : value;
        }
    }

    private record ParticipantSnapshot(
            String id,
            String name,
            String photoUrl,
            String country,
            String currentGiftId) {

        static ParticipantSnapshot from(Participant participant) {
            return new ParticipantSnapshot(
                    participant.getId(),
                    participant.getName(),
                    participant.getPhotoUrl(),
                    participant.getCountry(),
                    participant.getCurrentGiftId()
            );
        }

        Participant toDomain() {
            Participant participant = new Participant(id, name, photoUrl, country);
            participant.setCurrentGiftId(currentGiftId);
            return participant;
        }
    }

    private record GiftSnapshot(
            String id,
            String name,
            String description,
            String url,
            List<String> imageUrls,
            String originalOwnerParticipantId,
            String country,
            String winnerParticipantId,
            boolean revealed,
            int timesStolen) {

        static GiftSnapshot from(Gift gift) {
            return new GiftSnapshot(
                    gift.getId(),
                    gift.getName(),
                    gift.getDescription(),
                    gift.getUrl(),
                    List.copyOf(gift.getImageUrls()),
                    gift.getOriginalOwnerParticipantId(),
                    gift.getCountry(),
                    gift.getWinnerParticipantId(),
                    gift.isRevealed(),
                    gift.getTimesStolen()
            );
        }

        Gift toDomain() {
            List<String> images = imageUrls == null ? List.of() : imageUrls;
            Gift gift = new Gift(
                    id,
                    name,
                    description,
                    url,
                    images,
                    originalOwnerParticipantId,
                    country
            );
            gift.setWinnerParticipantId(winnerParticipantId);
            gift.setRevealed(revealed);
            gift.setTimesStolen(timesStolen);
            return gift;
        }
    }

    @FunctionalInterface
    private interface CheckedConsumer<T> {
        void accept(T value) throws IOException;
    }
}
