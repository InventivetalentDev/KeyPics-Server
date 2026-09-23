import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { HttpError } from "./lib/errors.js";
import { loadBackgrounds } from "./lib/backgrounds.js";
import { loadFontIndex } from "./lib/fonts.js";
import keyRouter from "./routes/key.js";
import mouseRouter from "./routes/mouse.js";
import fontsRouter from "./routes/fonts.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

/** Allows any site to embed or fetch the generated images. */
function cors(req, res, next) {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        res.set("Access-Control-Allow-Headers", req.get("Access-Control-Request-Headers") || "*");
        res.set("Access-Control-Max-Age", "86400");
        return res.sendStatus(204);
    }
    next();
}

function securityHeaders(req, res, next) {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
}

function notFound(req, res) {
    res.status(404).type("text/plain").send("Not found");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (err instanceof HttpError) {
        return res.status(err.status).type("text/plain").send(err.message);
    }
    // Errors raised by Express itself (malformed URL encoding, ...) carry a status.
    const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status >= 500) console.error(err);
    res.status(status).type("text/plain").send(status >= 500 ? "Internal server error" : err.message || "Bad request");
}

export function createApp() {
    loadFontIndex();
    loadBackgrounds();

    const app = express();
    app.disable("x-powered-by");
    app.set("etag", "weak");

    app.use(securityHeaders);
    app.use(cors);

    app.use("/.well-known", express.static(path.join(ROOT, ".well-known")));
    app.use(express.static(path.join(ROOT, "static"), { maxAge: "1h" }));

    app.use("/key", keyRouter);
    app.use("/mouse", mouseRouter);
    app.use("/fonts", fontsRouter);

    app.use(notFound);
    app.use(errorHandler);
    return app;
}
