import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ByteLruCache } from "../lib/cache.js";
import { int, parseColor, parseFile, positiveInt, query, str, toCssColor } from "../lib/params.js";
import { HttpError } from "../lib/errors.js";

describe("params", () => {
    test("parseFile splits label and format", () => {
        assert.deepEqual(parseFile("K.svg"), { label: "K", ext: "svg" });
        assert.deepEqual(parseFile("K.PNG"), { label: "K", ext: "png" });
        assert.deepEqual(parseFile("K"), { label: "K", ext: "svg" });
        assert.deepEqual(parseFile(".pics.svg"), { label: ".pics", ext: "svg" });
        assert.deepEqual(parseFile("v1.0"), { label: "v1.0", ext: "svg" });
        assert.deepEqual(parseFile("a.b.c"), { label: "a.b.c", ext: "svg" });
        assert.deepEqual(parseFile("far:smile.svg"), { label: "far:smile", ext: "svg" });
        assert.throws(() => parseFile("K.jpg"), (err) => err instanceof HttpError && err.status === 400);
        assert.throws(() => parseFile(".svg"), (err) => err instanceof HttpError && err.status === 400);
    });

    test("query helpers collapse arrays and skip empty values", () => {
        assert.equal(str(["a", "b"]), "a");
        assert.equal(str({ nested: 1 }), undefined);
        assert.equal(query({ font: "", fontFamily: "Roboto" }, "font_family", "fontFamily", "font"), "Roboto");
        assert.equal(query({}, "size"), undefined);
        assert.equal(query({ labelcolor: "red" }, "label_color", "labelColor"), "red");
    });

    test("integer parsing clamps and falls back", () => {
        assert.equal(int("-10", 0, -5, 5), -5);
        assert.equal(int("abc", 0, -5, 5), 0);
        assert.equal(positiveInt("0", 256, 2048), 256);
        assert.equal(positiveInt("300000", 256, 2048), 2048);
        assert.equal(positiveInt(undefined, 7, 2048), 7);
    });

    test("colors accept shortcuts and bare hex but reject injection", () => {
        assert.equal(parseColor("dark").hex(), "#565656");
        assert.equal(parseColor("LIGHT").hex(), "#DBDBDB");
        assert.equal(parseColor("abc").hex(), "#AABBCC");
        assert.ok(parseColor("#ff000080").alpha() < 1);
        assert.equal(toCssColor(parseColor("#ff000080")), "#FF000080");
        assert.equal(toCssColor(parseColor("rgb(0, 128, 0)")), "#008000");
        assert.throws(() => parseColor('red" onload="x'), (err) => err.status === 400);
        assert.throws(() => parseColor(""), (err) => err.status === 400);
        assert.throws(() => parseColor("#" + "f".repeat(200)), (err) => err.status === 400);
    });
});

describe("ByteLruCache", () => {
    test("evicts least recently used entries once the byte budget is exceeded", () => {
        const cache = new ByteLruCache(10);
        cache.set("a", "A", 4);
        cache.set("b", "B", 4);
        assert.equal(cache.get("a"), "A"); // touch a, so b becomes the oldest
        cache.set("c", "C", 4);
        assert.equal(cache.get("b"), undefined);
        assert.equal(cache.get("a"), "A");
        assert.equal(cache.get("c"), "C");
        assert.equal(cache.bytes, 8);
    });

    test("ignores entries larger than the budget and can be disabled", () => {
        const cache = new ByteLruCache(10);
        cache.set("big", "X", 11);
        assert.equal(cache.get("big"), undefined);
        const disabled = new ByteLruCache(0);
        disabled.set("a", "A", 1);
        assert.equal(disabled.get("a"), undefined);
    });
});
