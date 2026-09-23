/** An error whose status and message are safe to send to the client. */
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}
