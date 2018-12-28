const svg2img = require("svg2img");

function initNewSvg(width,height) {
    let window = require('svgdom');
    let SVG = require('svg.js')(window);
    let draw= SVG(window.document);
    draw.attr("generator", "https://key.pics");
    draw.attr("generator-time", (new Date()).toString());
    if (width && height) {
        draw.size(width, height);
    }
    return draw;
}

function sendImage(svgString, ext, res) {
    if (ext === "svg") {
        res.set({
            "Content-Type": "image/svg+xml",
            "Content-Length": svgString.length
        });
        res.send(svgString);
    } else if (ext === "png") {
        svg2img(svgString, (err, buffer) => {
            res.set({
                "Content-Type": "image/png",
                "Content-Length": buffer.length
            });
            res.send(buffer);
        })
    }else{
        res.status(400).send("Unsupported format: " + ext);
    }
}

module.exports = {initNewSvg, sendImage};
