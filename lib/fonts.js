import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { HttpError } from "./errors.js";

export const FONTS_DIR = fileURLToPath(new URL("../assets/fonts/", import.meta.url));

// Font family and style names are plain identifiers. Anything else is rejected
// before it can be used in a lookup, so user input never touches the file system.
const NAME = /^[A-Za-z0-9]{1,64}$/;
const FONT_FILE = /\.(?:ttf|otf)$/i;

/** family name -> { styles: Map<style name, file path>, license: file path | null } */
const families = new Map();
/** file path -> parsed opentype.js Font */
const parsedFonts = new Map();

/**
 * Scans the fonts directory once. Each family lives in its own folder and its
 * files are named `<Family>-<Style>.ttf`; an optional `*.txt` holds the license.
 */
export function loadFontIndex(dir = FONTS_DIR) {
    families.clear();
    parsedFonts.clear();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !NAME.test(entry.name)) continue;
        const familyDir = path.join(dir, entry.name);
        const styles = new Map();
        let license = null;
        for (const file of fs.readdirSync(familyDir).sort()) {
            if (FONT_FILE.test(file) && file.startsWith(entry.name + "-")) {
                const style = file.slice(entry.name.length + 1).replace(FONT_FILE, "");
                if (NAME.test(style)) styles.set(style, path.join(familyDir, file));
            } else if (!license && file.toLowerCase().endsWith(".txt")) {
                license = path.join(familyDir, file);
            }
        }
        if (styles.size > 0) families.set(entry.name, { styles, license });
    }
    return families;
}

export function listFamilies() {
    return [...families.keys()].sort();
}

export function getFamily(name) {
    return typeof name === "string" && NAME.test(name) ? families.get(name) : undefined;
}

export function listStyles(family) {
    const entry = getFamily(family);
    return entry ? [...entry.styles.keys()] : undefined;
}

/** Returns the parsed font for a family/style pair, parsing and caching it on first use. */
export function getFont(family, style) {
    const entry = getFamily(family);
    const file = entry && typeof style === "string" && NAME.test(style) ? entry.styles.get(style) : undefined;
    if (!file) throw new HttpError(400, `Unknown font ${family} ${style}`);

    let font = parsedFonts.get(file);
    if (!font) {
        const buffer = fs.readFileSync(file);
        font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        parsedFonts.set(file, font);
    }
    return font;
}
