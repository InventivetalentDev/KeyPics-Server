/**
 * Minimal least-recently-used cache bounded by the total size of its entries
 * (in bytes) rather than by entry count, so a handful of large PNGs cannot
 * crowd out everything else without limit.
 */
export class ByteLruCache {
    #entries = new Map();
    #bytes = 0;

    constructor(maxBytes) {
        this.maxBytes = maxBytes;
    }

    get size() {
        return this.#entries.size;
    }

    get bytes() {
        return this.#bytes;
    }

    get(key) {
        const entry = this.#entries.get(key);
        if (!entry) return undefined;
        // Re-insert to mark as most recently used.
        this.#entries.delete(key);
        this.#entries.set(key, entry);
        return entry.value;
    }

    set(key, value, size) {
        if (this.maxBytes <= 0 || size > this.maxBytes) return;
        this.delete(key);
        this.#entries.set(key, { value, size });
        this.#bytes += size;
        while (this.#bytes > this.maxBytes) {
            const oldestKey = this.#entries.keys().next().value;
            this.delete(oldestKey);
        }
    }

    delete(key) {
        const entry = this.#entries.get(key);
        if (!entry) return false;
        this.#entries.delete(key);
        this.#bytes -= entry.size;
        return true;
    }

    clear() {
        this.#entries.clear();
        this.#bytes = 0;
    }
}
