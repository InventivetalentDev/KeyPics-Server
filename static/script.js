(function () {
    "use strict";

    // Requests go to the server this page is served from, so the demo also works
    // for self-hosted instances and local development.
    const BASE = /^https?:/.test(window.location.origin) ? window.location.origin : "https://key.pics";
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const ICON_LABEL = /^fa[bsr]:/;
    const DEFAULT_FONT = "OpenSans";

    const byId = (id) => document.getElementById(id);

    function debounce(fn, wait) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function fetchJson(url) {
        return fetch(url).then((response) => {
            if (!response.ok) throw new Error(`${url} responded with ${response.status}`);
            return response.json();
        });
    }

    function setOptions(select, values, selected) {
        select.replaceChildren(...values.map((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = value === selected;
            return option;
        }));
        M.FormSelect.init(select);
    }

    function setDisabled(select, disabled) {
        if (select.disabled === disabled) return;
        select.disabled = disabled;
        M.FormSelect.init(select);
    }

    function toQueryString(params) {
        const query = new URLSearchParams(params).toString();
        return query.length > 0 ? "?" + query : "";
    }

    // camelCase parameters become kebab-case data attributes (data-font-family),
    // which the browser exposes as dataset.fontFamily again.
    function toDataAttributes(params) {
        return Object.keys(params)
            .map((key) => {
                const attribute = key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
                const value = String(params[key]).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
                return `data-${attribute}="${value}"`;
            })
            .join(" ");
    }

    function randomLetter() {
        return LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }

    function setupDemo({ prefix, buildParams, buildUrl, buildHtml }) {
        const target = byId(`${prefix}DemoTarget`);
        const urlPreview = byId(`${prefix}UrlPreview`);
        const htmlPreview = byId(`${prefix}HtmlPreview`);
        const fontFamily = byId(`${prefix}FontFamily`);
        const fontStyle = byId(`${prefix}FontStyle`);
        const fontLicense = byId(`${prefix}FontLicense`);
        const inputs = document.querySelectorAll(`.${prefix}DemoInput`);

        function refresh() {
            const label = byId(`${prefix}Label`).value;
            const isIcon = ICON_LABEL.test(label);
            setDisabled(fontFamily, isIcon);
            setDisabled(fontStyle, isIcon);

            const params = buildParams();
            const url = buildUrl(params);
            target.src = url;
            urlPreview.value = url;
            htmlPreview.value = buildHtml(params);
            M.textareaAutoResize(urlPreview);
            M.textareaAutoResize(htmlPreview);
        }

        function loadStyles() {
            const family = fontFamily.value;
            fontLicense.href = `${BASE}/fonts/${encodeURIComponent(family)}`;
            fetchJson(`${BASE}/fonts/${encodeURIComponent(family)}/styles`)
                .then((styles) => {
                    setOptions(fontStyle, styles, styles.includes("Regular") ? "Regular" : styles[0]);
                    refresh();
                })
                .catch((error) => console.warn("Could not load font styles", error));
        }

        const debouncedRefresh = debounce(refresh, 250);
        inputs.forEach((input) => {
            input.addEventListener("change", refresh);
            input.addEventListener("keyup", debouncedRefresh);
        });
        fontFamily.addEventListener("change", loadStyles);
        target.addEventListener("load", () => urlPreview.classList.remove("red"));
        target.addEventListener("error", () => urlPreview.classList.add("red"));

        return { refresh, loadStyles, fontFamily };
    }

    function collectParams(prefix, defaults) {
        const params = {};
        for (const [key, { id, defaultValue, transform }] of Object.entries(defaults)) {
            let value = byId(`${prefix}${id}`).value;
            if (transform) value = transform(value);
            if (value !== defaultValue && value !== undefined) params[key] = value;
        }
        return params;
    }

    const fontSize = (value) => (Number(value) > 0 ? value : undefined);

    const keyDemo = setupDemo({
        prefix: "key",
        buildParams: () => collectParams("key", {
            style: { id: "Style", defaultValue: "classic" },
            size: { id: "Size", defaultValue: "256" },
            shape: { id: "Shape", defaultValue: "square" },
            color: { id: "Color", defaultValue: "#565656" },
            labelColor: { id: "LabelColor", defaultValue: "auto" },
            fontFamily: { id: "FontFamily", defaultValue: DEFAULT_FONT },
            fontStyle: { id: "FontStyle", defaultValue: "Regular" },
            fontSize: { id: "FontSize", defaultValue: undefined, transform: fontSize },
        }),
        buildUrl: (params) => `${BASE}/key/${encodeURIComponent(byId("keyLabel").value)}.svg${toQueryString(params)}`,
        buildHtml: (params) => `<i class="keypics" data-type="key" ${toDataAttributes(params)}>${byId("keyLabel").value}</i>`,
    });

    const mouseDemo = setupDemo({
        prefix: "mouse",
        buildParams: () => {
            const params = collectParams("mouse", {
                size: { id: "Size", defaultValue: "256" },
                color: { id: "Color", defaultValue: "#565656" },
                pressedColor: { id: "PressedColor", defaultValue: "auto" },
                label: { id: "Label", defaultValue: "" },
                labelColor: { id: "LabelColor", defaultValue: "auto" },
                fontFamily: { id: "FontFamily", defaultValue: DEFAULT_FONT },
                fontStyle: { id: "FontStyle", defaultValue: "Regular" },
                fontSize: { id: "FontSize", defaultValue: undefined, transform: fontSize },
            });
            if (!byId("mouseOutline").checked) params.outline = "false";
            return params;
        },
        buildUrl: (params) => `${BASE}/mouse/${encodeURIComponent(byId("mouseButton").value)}.svg${toQueryString(params)}`,
        buildHtml: (params) => `<i class="keypics" data-type="mouse" ${toDataAttributes(params)}>${byId("mouseButton").value}</i>`,
    });

    // Init
    document.querySelectorAll("select").forEach((select) => M.FormSelect.init(select));
    byId("keyLabel").value = randomLetter();
    M.updateTextFields();

    fetchJson(`${BASE}/fonts`)
        .then((families) => {
            for (const demo of [keyDemo, mouseDemo]) {
                setOptions(demo.fontFamily, families.includes(DEFAULT_FONT) ? families : [DEFAULT_FONT, ...families], DEFAULT_FONT);
                demo.loadStyles();
            }
        })
        .catch((error) => console.warn("Could not load font list", error));

    keyDemo.refresh();
    mouseDemo.refresh();
})();
