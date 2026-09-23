import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

/** "prefix:name" -> icon definition, including the aliases Font Awesome keeps for older names. */
const icons = new Map();

for (const [prefix, pack] of [["fas", fas], ["far", far], ["fab", fab]]) {
    for (const definition of Object.values(pack)) {
        if (!definition || typeof definition.iconName !== "string") continue;
        icons.set(`${prefix}:${definition.iconName}`, definition);
        for (const alias of definition.icon[2] ?? []) {
            if (typeof alias === "string") icons.set(`${prefix}:${alias}`, definition);
        }
    }
}

/**
 * Labels of the form `fas:name`, `far:name` or `fab:name` request a Font Awesome
 * icon instead of text. Returns null for ordinary text labels.
 */
export function parseIconLabel(label) {
    const match = /^(fa[bsr]):(.*)$/i.exec(label);
    return match ? { prefix: match[1].toLowerCase(), name: match[2].trim().toLowerCase() } : null;
}

export function findIcon(prefix, name) {
    return icons.get(`${prefix}:${name}`);
}

/** Path data of an icon definition (duotone icons carry an array of two paths). */
export function iconPathData(definition) {
    const data = definition.icon[4];
    return Array.isArray(data) ? data.join(" ") : data;
}

export function iconCount() {
    return icons.size;
}
