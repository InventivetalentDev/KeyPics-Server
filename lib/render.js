import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { svgPathBbox } from "svg-path-bbox";
import { Resvg } from "@resvg/resvg-js";
import { HttpError } from "./errors.js";
import { findIcon, iconPathData, parseIconLabel } from "./icons.js";
import { getFont } from "./fonts.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const GENERATOR = "https://key.pics";
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

const parser = new DOMParser();
const serializer = new XMLSerializer();

/** Removes whitespace-only text nodes so serialized output stays compact. */
export function stripWhitespace(element) {
    let child = element.firstChild;
    while (child) {
        const next = child.nextSibling;
        if (child.nodeType === TEXT_NODE && child.data.trim() === "") {
            element.removeChild(child);
        } else if (child.nodeType === ELEMENT_NODE) {
            stripWhitespace(child);
        }
        child = next;
    }
}

function hasClass(element, className) {
    const classes = element.getAttribute("class");
    return typeof classes === "string" && classes.split(/\s+/).includes(className);
}

function round(value, places = 3) {
    return Number(value.toFixed(places)).toString();
}

/**
 * A fresh SVG document per request. Every value written into it goes through
 * the DOM, so attribute values are always escaped on serialization.
 */
export class Canvas {
    constructor(width, height) {
        this.doc = parser.parseFromString(`<svg xmlns="${SVG_NS}"/>`, "image/svg+xml");
        this.root = this.doc.documentElement;
        this.width = width;
        this.height = height;
        this.root.setAttribute("width", round(width));
        this.root.setAttribute("height", round(height));
        this.root.setAttribute("viewBox", `0 0 ${round(width)} ${round(height)}`);
        this.root.setAttribute("data-generator", GENERATOR);
    }

    /** Nests a parsed background document; its own viewBox scales it to the canvas. */
    addBackground(backgroundDoc) {
        this.root.appendChild(this.doc.importNode(backgroundDoc.documentElement, true));
        return this;
    }

    #elementsWithClass(className) {
        const all = this.root.getElementsByTagName("*");
        const matches = [];
        for (let i = 0; i < all.length; i++) {
            if (hasClass(all[i], className)) matches.push(all[i]);
        }
        return matches;
    }

    fillClass(className, color) {
        for (const element of this.#elementsWithClass(className)) element.setAttribute("fill", color);
        return this;
    }

    strokeClass(className, color) {
        for (const element of this.#elementsWithClass(className)) element.setAttribute("stroke", color);
        return this;
    }

    addPath(attributes) {
        const pathElement = this.doc.createElementNS(SVG_NS, "path");
        for (const [name, value] of Object.entries(attributes)) {
            if (value !== undefined) pathElement.setAttribute(name, String(value));
        }
        this.root.appendChild(pathElement);
        return pathElement;
    }

    toSvg() {
        return serializer.serializeToString(this.doc);
    }

    toPng() {
        const renderer = new Resvg(this.toSvg(), {
            fitTo: { mode: "original" },
            // All text is already converted to outlines, so no fonts are needed.
            font: { loadSystemFonts: false },
        });
        return renderer.render().asPng();
    }
}

/**
 * Draws text as glyph outlines, centered on (x, y) both horizontally and
 * vertically (the "center middle" anchor of the previous text-to-svg based
 * implementation, reproduced so existing icons render identically).
 */
export function drawText(canvas, text, { font, fontSize, x, y, fill }) {
    const scale = fontSize / font.unitsPerEm;
    const width = font.getAdvanceWidth(text, fontSize, { kerning: true });
    const height = (font.ascender - font.descender) * scale;
    const left = x - width / 2;
    const baseline = y - height / 2 + font.ascender * scale;
    // Explicit options: opentype.js 2 would otherwise flip the y axis and rewrite subpaths.
    const d = font.getPath(text, left, baseline, fontSize, { kerning: true })
        .toPathData({ decimalPlaces: 2, optimize: false, flipY: false });
    return canvas.addPath({ fill, d: closeSubpaths(d) });
}

/** Glyph contours are always closed; make that explicit with a `Z` per subpath. */
export function closeSubpaths(d) {
    return d
        .split(/(?=M)/)
        .map((subpath) => (subpath.length === 0 || subpath.endsWith("Z") ? subpath : subpath + "Z"))
        .join("");
}

/** Draws a Font Awesome icon scaled to `fontSize` wide and centered on (x, y). */
export function drawIcon(canvas, definition, { fontSize, x, y, fill }) {
    const d = iconPathData(definition);
    const [minX, minY, maxX, maxY] = svgPathBbox(d);
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const scale = boxWidth > 0 ? fontSize / boxWidth : 1;
    const translateX = x - scale * (minX + boxWidth / 2);
    const translateY = y - scale * (minY + boxHeight / 2);
    return canvas.addPath({
        fill,
        transform: `translate(${round(translateX)} ${round(translateY)}) scale(${round(scale, 6)})`,
        d,
    });
}

/**
 * Draws a label, which is either a Font Awesome icon reference
 * (`fas:`, `far:`, `fab:` prefix) or text rendered with the requested font.
 */
export function drawLabel(canvas, label, { fontFamily, fontStyle, fontSize, x, y, fill }) {
    const icon = parseIconLabel(label);
    if (icon) {
        const definition = findIcon(icon.prefix, icon.name);
        if (!definition) throw new HttpError(400, `Unknown icon ${icon.prefix}:${icon.name}`);
        return drawIcon(canvas, definition, { fontSize, x, y, fill });
    }
    const font = getFont(fontFamily, fontStyle);
    return drawText(canvas, label, { font, fontSize, x, y, fill });
}
