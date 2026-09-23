import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "@xmldom/xmldom";
import { stripWhitespace } from "./render.js";

export const BACKGROUNDS_DIR = fileURLToPath(new URL("../assets/bg/", import.meta.url));

const NAME = /^[A-Za-z0-9_-]{1,32}$/;

/** "key/square/classic" -> parsed SVG Document */
const backgrounds = new Map();

/** Parses every background SVG once at start-up. */
export function loadBackgrounds(dir = BACKGROUNDS_DIR) {
    backgrounds.clear();
    const parser = new DOMParser();
    const walk = (folder, keyParts) => {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                walk(path.join(folder, entry.name), [...keyParts, entry.name]);
            } else if (entry.name.endsWith(".svg")) {
                const source = fs.readFileSync(path.join(folder, entry.name), "utf8");
                const doc = parser.parseFromString(source, "image/svg+xml");
                stripWhitespace(doc.documentElement);
                backgrounds.set([...keyParts, entry.name.slice(0, -4)].join("/"), doc);
            }
        }
    };
    walk(dir, []);
    return backgrounds;
}

/** Looks up a background by its path parts, e.g. ("key", "square", "classic"). */
export function getBackground(...parts) {
    if (!parts.every((part) => typeof part === "string" && NAME.test(part))) return undefined;
    return backgrounds.get(parts.join("/"));
}

export function listBackgrounds() {
    return [...backgrounds.keys()].sort();
}
