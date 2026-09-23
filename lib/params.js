import Color from "color";
import { HttpError } from "./errors.js";

const NAMED_COLORS = { dark: "#565656", light: "#dbdbdb" };
const BARE_HEX = /^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const MAX_COLOR_LENGTH = 64;
const SUPPORTED_FORMATS = new Set(["svg", "png"]);
const OTHER_IMAGE_FORMATS = /^(?:jpe?g|gif|webp|bmp|ico|avif|tiff?)$/i;

/** Returns a query value as a string. Repeated parameters collapse to the first one. */
export function str(value) {
    if (Array.isArray(value)) value = value[0];
    return typeof value === "string" ? value : undefined;
}

/**
 * Returns the first non-empty query parameter among several accepted names.
 * All-lowercase spellings (`fontfamily`) are accepted as well, because that is
 * what browsers produce for `data-fontFamily` attributes.
 */
export function query(params, ...names) {
    for (const name of names) {
        for (const candidate of [name, name.toLowerCase()]) {
            const value = str(params[candidate]);
            if (value !== undefined && value !== "") return value;
        }
    }
    return undefined;
}

/** Parses an integer and clamps it into [min, max]; unparsable input yields the fallback. */
export function int(value, fallback, min, max) {
    let parsed = Number.parseInt(value ?? "", 10);
    if (!Number.isFinite(parsed)) parsed = fallback;
    return Math.min(max, Math.max(min, parsed));
}

/** Parses a positive integer capped at `max`; zero, negative or unparsable input yields the fallback. */
export function positiveInt(value, fallback, max) {
    const parsed = Number.parseInt(value ?? "", 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(max, parsed);
}

/**
 * Parses a CSS color. Accepts the named shortcuts `dark` and `light` and bare
 * hex values without the `#` (which is awkward to put in a URL).
 * Throws a 400 HttpError for anything the color library cannot parse, so raw
 * user input never reaches the SVG output.
 */
export function parseColor(input, what = "color") {
    const raw = String(input).trim();
    if (raw.length === 0 || raw.length > MAX_COLOR_LENGTH) {
        throw new HttpError(400, `Could not parse ${what} ${raw.slice(0, MAX_COLOR_LENGTH)}`);
    }
    const named = NAMED_COLORS[raw.toLowerCase()];
    const candidates = named ? [named] : [raw];
    if (!named && BARE_HEX.test(raw)) candidates.push("#" + raw);
    for (const candidate of candidates) {
        try {
            return Color(candidate);
        } catch {
            // try the next candidate
        }
    }
    throw new HttpError(400, `Could not parse ${what} ${raw}`);
}

/** Serializes a color for use in an SVG attribute, keeping alpha when present. */
export function toCssColor(color) {
    return color.alpha() < 1 ? color.hexa() : color.hex();
}

/**
 * Splits the last path segment into label and output format.
 * `K.svg` -> K/svg, `K.png` -> K/png, `K` -> K/svg, `.pics.svg` -> .pics/svg,
 * `v1.0` -> v1.0/svg (dots stay part of the label unless they introduce a
 * supported format), `K.jpg` -> 400.
 */
export function parseFile(file) {
    let label = file;
    let ext = "svg";
    const match = /^(.*)\.([a-z0-9]{1,5})$/i.exec(file);
    if (match) {
        const candidate = match[2].toLowerCase();
        if (SUPPORTED_FORMATS.has(candidate)) {
            label = match[1];
            ext = candidate;
        } else if (OTHER_IMAGE_FORMATS.test(candidate)) {
            throw new HttpError(400, `Unsupported format: ${candidate}`);
        }
    }
    if (label.length === 0) throw new HttpError(400, "Missing label");
    return { label, ext };
}
