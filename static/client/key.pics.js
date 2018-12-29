var KeyPics =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "autoApply", function() { return autoApply; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyIcon", function() { return applyIcon; });
function autoApply() {
    console.debug("[key.pics] Auto-applying icons");
    let elements = document.querySelectorAll("i.keypics");
    for (let i = 0; i < elements.length; i++) {
        applyIcon(elements[i]);
    }
}

function applyIcon(element) {
    if (!element) return;
    if (Array.isArray(element)) {
        for (let i = 0; i < element.length; i++) {
            applyIcon(element[i]);
        }
        return;
    }

    let labelOrPressed = element.innerHTML;
    let type = element.dataset.type || "key";// key*, mouse
    let mode = element.dataset.mode || "link";// link*, fetch


    let url;
    if (type === "key") {
        url = getKeyUrl(labelOrPressed, element.dataset);
    } else if (type === "mouse") {
        url = getMouseUrl(labelOrPressed, element.dataset);
    } else {
        throw "Unknown type " + type;
    }

    if (mode === "link") {
        let imgElement = document.createElement("img");
        for (let d in element.dataset) {
            imgElement.dataset[d] = element.dataset[d]
        }
        imgElement.innerHTML = element.innerHTML;
        imgElement.className = element.className;
        imgElement.alt = element.innerHTML;
        imgElement.src = url;
        element.parentNode.replaceChild(imgElement, element);
    } else if (mode === "fetch") {
        fetch(url)
            .then((res) => res.text())
            .then((svgData) => {
                element.innerHTML = svgData;
            })
            .catch((err) => {
                throw err;
            });
    } else {
        throw "Unknown mode " + mode;
    }
}


function getKeyUrl(label, params) {
    return "https://key.pics/key/" + label + ".svg?" + buildQueryString(params)
}

function getMouseUrl(pressed, params) {
    return "https://key.pics/mouse/" + pressed + ".svg?" + buildQueryString(params)
}

function buildQueryString(params) {
    if (!params) return "";
    return Object.keys(params)
        .map(k => k + "=" + encodeURIComponent(params[k]))
        .join("&");
}

(function () {
    autoApply();
})();

/***/ })
/******/ ]);