/*! key.pics v1.1.0 | MIT | https://key.pics */
var KeyPics = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    applyIcon: () => applyIcon,
    autoApply: () => autoApply,
    buildQueryString: () => buildQueryString,
    getKeyUrl: () => getKeyUrl,
    getMouseUrl: () => getMouseUrl
  });
  var BASE_URL = "https://key.pics";
  var SELECTOR = "i.keypics";
  var CONTROL_ATTRIBUTES = /* @__PURE__ */ new Set(["type", "mode"]);
  var ELEMENT_NODE = 1;
  function buildQueryString(params) {
    if (!params) return "";
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (CONTROL_ATTRIBUTES.has(key) || value === void 0 || value === null) continue;
      search.append(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  }
  function getKeyUrl(label, params) {
    return `${BASE_URL}/key/${encodeURIComponent(label)}.svg${buildQueryString(params)}`;
  }
  function getMouseUrl(pressed, params) {
    return `${BASE_URL}/mouse/${encodeURIComponent(pressed)}.svg${buildQueryString(params)}`;
  }
  function warn(message, element) {
    if (typeof console !== "undefined") console.warn(`[key.pics] ${message}`, element);
  }
  function replaceWithImage(element, url, label) {
    const img = document.createElement("img");
    for (const [key, value] of Object.entries(element.dataset)) img.dataset[key] = value;
    img.className = element.className;
    img.alt = label;
    img.src = url;
    element.replaceWith(img);
    return img;
  }
  function inlineSvg(element, url) {
    return fetch(url).then((response) => {
      if (!response.ok) throw new Error(`key.pics responded with ${response.status} for ${url}`);
      return response.text();
    }).then((svgText) => {
      const svg = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== "svg") throw new Error(`key.pics returned no SVG for ${url}`);
      element.replaceChildren(document.importNode(svg, true));
      return element;
    }).catch((error) => {
      element.classList.add("keypics-error");
      warn(error.message, element);
      return element;
    });
  }
  function applyIcon(element) {
    if (!element) return void 0;
    if (element.nodeType !== ELEMENT_NODE) {
      if (typeof element[Symbol.iterator] === "function") {
        return Array.from(element, (item) => applyIcon(item));
      }
      return void 0;
    }
    const label = (element.textContent || "").trim();
    const type = element.dataset.type || "key";
    const mode = element.dataset.mode || "link";
    let url;
    if (type === "key") {
      url = getKeyUrl(label, element.dataset);
    } else if (type === "mouse") {
      url = getMouseUrl(label, element.dataset);
    } else {
      warn(`Unknown type "${type}" (expected "key" or "mouse")`, element);
      return void 0;
    }
    if (mode === "link") return replaceWithImage(element, url, label);
    if (mode === "fetch") return inlineSvg(element, url);
    warn(`Unknown mode "${mode}" (expected "link" or "fetch")`, element);
    return void 0;
  }
  function autoApply(root = document) {
    return applyIcon(root.querySelectorAll(SELECTOR));
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => autoApply(), { once: true });
    } else {
      autoApply();
    }
  }
  return __toCommonJS(index_exports);
})();
