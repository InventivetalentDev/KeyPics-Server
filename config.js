// Runtime configuration. Every value can be overridden through the environment.

function envInt(name, fallback) {
    const parsed = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default {
    // TCP port to listen on.
    port: envInt("PORT", 8451),
    // Largest accepted `size` (pixels). Bounds the cost of PNG rendering.
    maxSize: envInt("KEYPICS_MAX_SIZE", 2048),
    // Longest accepted label (characters).
    maxLabelLength: envInt("KEYPICS_MAX_LABEL_LENGTH", 100),
    // In-memory cache for rendered images. 0 disables the cache.
    cacheMaxBytes: envInt("KEYPICS_CACHE_MAX_BYTES", 32 * 1024 * 1024),
    // `Cache-Control: max-age` (seconds) sent with generated images.
    cacheMaxAge: envInt("KEYPICS_CACHE_MAX_AGE", 86400),
};
