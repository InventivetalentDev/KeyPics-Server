import config from "../config.js";
import { ByteLruCache } from "./cache.js";
import { HttpError } from "./errors.js";
import { int, parseColor, positiveInt, query, toCssColor } from "./params.js";

export const imageCache = new ByteLruCache(config.cacheMaxBytes);

const CONTENT_TYPES = { svg: "image/svg+xml", png: "image/png" };

/**
 * Reads the label-related query parameters shared by the key and mouse routes.
 * Both snake_case and camelCase spellings are accepted, as before.
 */
export function parseLabelOptions(params, { width, height, targetColor }) {
    const labelColor = query(params, "label_color", "labelColor") ?? "auto";
    const fill = labelColor === "auto"
        ? targetColor.negate().grayscale().hex()
        : toCssColor(parseColor(labelColor, "label color"));
    const limit = config.maxSize;
    const defaultFontSize = Math.floor(Math.min(width, height) / 2);
    return {
        fill,
        offsetX: int(query(params, "label_offset_x", "labelOffsetX"), 0, -limit, limit),
        offsetY: int(query(params, "label_offset_y", "labelOffsetY"), 0, -limit, limit),
        fontFamily: query(params, "font_family", "fontFamily", "font") ?? "OpenSans",
        fontStyle: query(params, "font_style", "fontStyle") ?? "Regular",
        fontSize: positiveInt(query(params, "font_size", "fontSize"), defaultFontSize, limit * 2),
    };
}

export function parseSize(params) {
    return positiveInt(query(params, "size"), 256, config.maxSize);
}

export function checkLabelLength(label) {
    if (label.length > config.maxLabelLength) {
        throw new HttpError(400, `Label too long (max ${config.maxLabelLength} characters)`);
    }
}

/**
 * Sends a rendered image, serving it from the in-memory cache when the same
 * parameters were rendered before. `build` must return a Canvas.
 */
export function respondWithImage(res, { ext, cacheKey, start }, build) {
    let body = imageCache.get(cacheKey);
    const hit = body !== undefined;
    if (!hit) {
        const canvas = build();
        body = ext === "png" ? canvas.toPng() : Buffer.from(canvas.toSvg(), "utf8");
        imageCache.set(cacheKey, body, body.length);
    }

    res.set("Cache-Control", `public, max-age=${config.cacheMaxAge}`);
    res.set("X-Cache", hit ? "HIT" : "MISS");
    res.set("X-Gen-Duration", String(Date.now() - start));
    if (ext === "svg") {
        // Stops scripts from running if the SVG is opened directly in a browser tab.
        res.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    }
    res.type(CONTENT_TYPES[ext]);
    res.send(body);
}
