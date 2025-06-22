module.exports = {
    // TOKEN has become TOKENS and is now an array
    TOKENS: [
        "your_token_1", // Replace with your actual Discord bot token
        "your_token_2", // Optional second token
        //"your_token_3", // Exemple Optional third token
        // Add more tokens here if needed
    ],

    OWNER_ID: "0000000000001", // Replace with your Discord user ID for owner commands
    EMBED_COLOR: "#000001", // Color used in embed messages
    DEFAULT_VOLUME: 100, // Default volume (e.g., 50% out of 100%)

    // Default search terms for autocomplete
    SEARCH_DEFAULT: ["lo fi", "jvke", "post malone", "bassboost"],

    // Time before the bot leaves an empty voice channel (in milliseconds)
    LEAVE_EMPTY: 120000, // 2 minutes

    // Whether to support playlists with more than 100 Spotify tracks
    SPOTIFY_TRACKS: true, // true = support Spotify, false = disable

    // Spotify credentials used for API authentication
    SPOTIFY_ID: "your_spotify_client_id", // Replace with your Spotify client ID
    SPOTIFY_SECRET: "your_spotify_client_secret", // Replace with your Spotify client secret
}

// Converts various string/boolean inputs into a proper boolean
function parseBoolean(ask) {
    if (typeof (ask) === 'string') {
        ask = ask.trim().toLowerCase();
    }
    switch (ask) {
        case true:
        case "true":
            return true;
        default:
            return false;
    }
}
