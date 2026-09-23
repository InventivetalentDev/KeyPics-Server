import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let base;

before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
        server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });
const attr = (svg, selector, name) => new RegExp(`${selector}[^>]*\\s${name}="([^"]*)"`).exec(svg)?.[1];
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("key images", () => {
    test("renders a labelled key as SVG with the expected structure", async () => {
        const res = await get("/key/K.svg?size=128");
        assert.equal(res.status, 200);
        assert.match(res.headers.get("content-type"), /^image\/svg\+xml/);
        const svg = await res.text();
        assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="128" height="128" viewBox="0 0 128 128"/);
        assert.equal(attr(svg, 'class="background"', "fill"), "#565656");
        assert.equal(attr(svg, 'class="dark_shadow"', "fill"), "#474747");
        assert.equal(attr(svg, 'class="light_shadow"', "fill"), "#585858");
        assert.equal(attr(svg, 'class="front_line"', "stroke"), "#2B2B2B");
        // Glyph outline identical to what the previous text-to-svg based renderer produced.
        assert.ok(svg.includes('<path fill="#A9A9A9" d="M64.58 62.98L83.64 88.83L77.39 88.83L60.73 66.67L55.95 70.92L55.95 88.83L50.64 88.83L50.64 43.14L55.95 43.14L55.95 65.80L76.67 43.14L82.95 43.14L64.58 62.98Z"/>'));
    });

    test("renders PNG", async () => {
        const res = await get("/key/K.png?size=64");
        assert.equal(res.status, 200);
        assert.equal(res.headers.get("content-type"), "image/png");
        const body = Buffer.from(await res.arrayBuffer());
        assert.deepEqual(body.subarray(0, 4), PNG_MAGIC);
    });

    test("defaults to SVG without an extension and keeps dots in labels", async () => {
        const res = await get("/key/v1.0");
        assert.equal(res.status, 200);
        assert.match(res.headers.get("content-type"), /^image\/svg\+xml/);
        assert.equal((await get("/key/.pics.svg")).status, 200);
    });

    test("rejects unsupported image formats", async () => {
        const res = await get("/key/K.jpg");
        assert.equal(res.status, 400);
        assert.equal(await res.text(), "Unsupported format: jpg");
    });

    test("shapes change the aspect ratio", async () => {
        const wide = await (await get("/key/ctrl.svg?shape=wide&size=128")).text();
        assert.match(wide, /^<svg[^>]* width="128" height="64" viewBox="0 0 128 64"/);
        const tall = await (await get("/key/ctrl.svg?shape=tall&size=128")).text();
        assert.match(tall, /^<svg[^>]* width="64" height="128"/);
        assert.equal((await get("/key/K.svg?style=flat")).status, 200);
        assert.equal((await get("/key/K.svg?style=plain")).status, 200);
    });

    test("unknown shape or style is a 404", async () => {
        assert.equal((await get("/key/K.svg?shape=round")).status, 404);
        assert.equal((await get("/key/K.svg?style=neon")).status, 404);
        assert.equal((await get("/key/K.svg?style=..%2F..%2Fmouse%2Fflat")).status, 404);
    });

    test("supports color shortcuts, bare hex and rejects garbage", async () => {
        const light = await (await get("/key/K.svg?color=light")).text();
        assert.equal(attr(light, 'class="background"', "fill"), "#DBDBDB");
        const bare = await (await get("/key/K.svg?color=ff0000")).text();
        assert.equal(attr(bare, 'class="background"', "fill"), "#FF0000");
        const named = await (await get("/key/K.svg?color=blue&labelColor=white")).text();
        assert.equal(attr(named, 'class="background"', "fill"), "#0000FF");
        assert.ok(named.includes('<path fill="#FFFFFF"'));
        const res = await get("/key/K.svg?color=notacolor");
        assert.equal(res.status, 400);
        assert.equal(await res.text(), "Could not parse color notacolor");
    });

    test("never lets attribute injection through the label color", async () => {
        const res = await get("/key/K.svg?labelColor=red%22%20onload=%22alert(1)");
        assert.equal(res.status, 400);
        assert.match(res.headers.get("content-type"), /^text\/plain/);
        assert.equal(res.headers.get("x-content-type-options"), "nosniff");
        assert.equal((await get("/key/K.svg?label_color=%3Cscript%3E")).status, 400);
        // A valid colour that merely looks suspicious is still rendered, safely escaped.
        const rendered = await (await get("/key/K.svg?labelColor=red")).text();
        assert.ok(!rendered.includes("onload"));
    });

    test("clamps the size", async () => {
        const huge = await (await get("/key/K.svg?size=999999999")).text();
        assert.match(huge, /^<svg[^>]* width="2048" height="2048"/);
        const negative = await (await get("/key/K.svg?size=-5")).text();
        assert.match(negative, /^<svg[^>]* width="256" height="256"/);
        const junk = await (await get("/key/K.svg?size=abc")).text();
        assert.match(junk, /^<svg[^>]* width="256"/);
    });

    test("rejects overly long labels", async () => {
        const res = await get("/key/" + "a".repeat(101) + ".svg");
        assert.equal(res.status, 400);
        assert.equal((await get("/key/" + "a".repeat(100) + ".svg")).status, 200);
    });

    test("renders Font Awesome icons, including legacy alias names", async () => {
        const res = await get("/key/fab:npm.svg?size=100&shape=wide&fontSize=70");
        assert.equal(res.status, 200);
        const svg = await res.text();
        assert.match(svg, /<path fill="#A9A9A9" transform="translate\([^)]+\) scale\([^)]+\)" d="M/);
        assert.equal((await get("/key/far:smile.svg")).status, 200);
        assert.equal((await get("/key/fas:arrow-up.svg")).status, 200);
    });

    test("unknown icon is a 400 and the server keeps running", async () => {
        const res = await get("/key/fas:nope123.svg");
        assert.equal(res.status, 400);
        assert.equal(await res.text(), "Unknown icon fas:nope123");
        assert.equal((await get("/key/K.svg")).status, 200);
    });

    test("unknown or traversing font names are a 400 and the server keeps running", async () => {
        assert.equal((await get("/key/K.svg?fontFamily=Nope")).status, 400);
        assert.equal((await get("/key/K.svg?font=Roboto&fontStyle=Nope")).status, 400);
        assert.equal((await get("/key/K.svg?fontFamily=..%2FRoboto")).status, 400);
        assert.equal((await get("/key/K.svg?font=Roboto&fontStyle=Bold")).status, 200);
        assert.equal((await get("/key/K.svg?font_family=Ubuntu&font_style=Medium&font_size=40&label_offset_x=3&label_offset_y=-3")).status, 200);
        // lowercase spellings, as produced by data-fontFamily attributes
        assert.equal((await get("/key/K.svg?fontfamily=Roboto&fontstyle=Bold&labelcolor=red")).status, 200);
        assert.equal((await get("/key/K.svg?fontfamily=Nope")).status, 400);
    });

    test("tolerates repeated and odd query parameters", async () => {
        assert.equal((await get("/key/K.svg?color=red&color=blue")).status, 200);
        assert.equal((await get("/key/K.svg?size=1&size=2&label=x&label=y")).status, 200);
    });

    test("malformed percent encoding is a 400, not a crash", async () => {
        assert.equal((await get("/key/%ZZ")).status, 400);
        assert.equal((await get("/key/K.svg")).status, 200);
    });

    test("supports non-ASCII labels", async () => {
        assert.equal((await get("/key/" + encodeURIComponent("➡") + ".svg")).status, 200);
        assert.equal((await get("/key/" + encodeURIComponent("Ä") + ".png?size=32")).status, 200);
    });
});

describe("mouse images", () => {
    test("redirects the bare route to the unpressed mouse", async () => {
        for (const path of ["/mouse", "/mouse/"]) {
            const res = await get(path);
            assert.equal(res.status, 302);
            assert.equal(res.headers.get("location"), "/mouse/none");
        }
        assert.equal((await get("/mouse/none")).status, 200);
    });

    test("highlights the pressed button and draws the label", async () => {
        const res = await get("/mouse/left.svg?label=x2&size=128");
        assert.equal(res.status, 200);
        const svg = await res.text();
        assert.match(svg, /^<svg[^>]* width="80" height="128"/);
        assert.equal(attr(svg, 'class="button_left background"', "fill"), "#A9A9A9");
        assert.equal(attr(svg, 'class="button_right background"', "fill"), "#565656");
        assert.equal(attr(svg, 'id="center_line"', "stroke"), "#A9A9A9");
        assert.ok(svg.includes('<path fill="#A9A9A9" d="M18.85 88.48L26.68 77.52'));

        const right = await (await get("/mouse/right.svg?outline=false")).text();
        assert.equal(attr(right, 'class="button_right background"', "fill"), "#A9A9A9");
        assert.equal(attr(right, 'id="center_line"', "stroke"), "none");
        const wheel = await (await get("/mouse/middle.svg?pressedColor=red")).text();
        assert.equal(attr(wheel, 'id="wheel"', "fill"), "#FF0000");
    });

    test("validates the pressed color", async () => {
        const res = await get("/mouse/left.svg?pressedColor=red%22%20onload=%22alert(1)");
        assert.equal(res.status, 400);
        assert.equal((await get("/mouse/left.png?size=48")).status, 200);
    });
});

describe("fonts", () => {
    test("lists families and styles", async () => {
        const families = await (await get("/fonts")).json();
        assert.ok(families.includes("OpenSans"));
        assert.ok(families.includes("Roboto"));
        const styles = await (await get("/fonts/Roboto/styles")).json();
        assert.ok(styles.includes("Regular"));
        assert.ok(styles.includes("BoldItalic"));
    });

    test("serves the license as text", async () => {
        const res = await get("/fonts/OpenSans");
        assert.equal(res.status, 200);
        assert.match(res.headers.get("content-type"), /^text\/plain/);
        assert.match(await res.text(), /Apache License/);
    });

    test("unknown fonts and traversal attempts are a 404 that always responds", async () => {
        assert.equal((await get("/fonts/Nope")).status, 404);
        assert.equal((await get("/fonts/Nope/styles")).status, 404);
        assert.equal((await get("/fonts/..%2F..%2F")).status, 404);
        assert.equal((await get("/fonts/..%2F..%2F/styles")).status, 404);
        assert.equal((await get("/fonts/.%2E/styles")).status, 404);
    });
});

describe("http behaviour", () => {
    test("sets caching, CORS and security headers on images", async () => {
        const res = await get("/key/Q.svg");
        assert.equal(res.headers.get("cache-control"), "public, max-age=86400");
        assert.equal(res.headers.get("access-control-allow-origin"), "*");
        assert.equal(res.headers.get("x-content-type-options"), "nosniff");
        assert.equal(res.headers.get("content-security-policy"), "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        assert.ok(res.headers.get("etag"));
        assert.ok(!res.headers.get("x-powered-by"));
        assert.match(res.headers.get("x-gen-duration"), /^\d+$/);
    });

    test("serves repeated renders from the cache and honours conditional requests", async () => {
        const first = await get("/key/cached.svg?color=green");
        assert.equal(first.headers.get("x-cache"), "MISS");
        const second = await get("/key/cached.svg?color=green");
        assert.equal(second.headers.get("x-cache"), "HIT");
        assert.equal(await first.text(), await second.text());
        // Node's fetch adds "Cache-Control: no-cache" to conditional requests, which forces a full
        // response; browsers and curl do not, so send an explicit Cache-Control header instead.
        const conditional = await get("/key/cached.svg?color=green", {
            headers: { "If-None-Match": second.headers.get("etag"), "Cache-Control": "max-age=0" },
        });
        assert.equal(conditional.status, 304);
    });

    test("answers CORS preflight and HEAD requests", async () => {
        const options = await get("/key/K.svg", { method: "OPTIONS" });
        assert.equal(options.status, 204);
        assert.equal(options.headers.get("access-control-allow-methods"), "GET, HEAD, OPTIONS");
        const head = await get("/key/K.svg", { method: "HEAD" });
        assert.equal(head.status, 200);
        assert.match(head.headers.get("content-type"), /^image\/svg\+xml/);
    });

    test("serves the landing page and the client bundle", async () => {
        const index = await get("/");
        assert.equal(index.status, 200);
        assert.match(index.headers.get("content-type"), /^text\/html/);
        assert.equal((await get("/client/key.pics.min.js")).status, 200);
    });

    test("unknown routes are a plain 404", async () => {
        const res = await get("/nope");
        assert.equal(res.status, 404);
        assert.equal(await res.text(), "Not found");
        assert.equal((await get("/key")).status, 404);
    });
});
