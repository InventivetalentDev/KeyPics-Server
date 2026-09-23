import { createApp } from "./app.js";
import config from "./config.js";

const app = createApp();
const server = app.listen(config.port, () => {
    console.log(`key.pics server listening on port ${server.address().port}`);
});

function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    // Do not wait forever for keep-alive connections.
    setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
