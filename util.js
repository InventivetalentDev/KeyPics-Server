const svg2img = require("svg2img");
const TextToSVG = require("text-to-svg");
const cwd = require("process").cwd;

const faCore = require('@fortawesome/fontawesome-svg-core');
const faRegular = require('@fortawesome/free-regular-svg-icons');
const faSolid = require('@fortawesome/free-solid-svg-icons');
const faBrands = require('@fortawesome/free-brands-svg-icons');

faCore.library.add(faRegular.far, faSolid.fas, faBrands.fab);

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

function drawLabel(draw, label, fontFamily, fontStyle, fontSize, labelColor,res) {
   return new Promise((resolve,reject)=>{
       if (label.startsWith("far:") || label.startsWith("fas:") || label.startsWith("fab:")) {
           let split = label.split(":");
           let prefix = split[0];
           let iconName = split[1];

           let def = faCore.findIconDefinition({prefix: prefix, iconName: iconName});
           if (!def) {
               res.status(400).send("Unknown icon " + prefix + ":" + iconName);
               reject();
               return;
           }
           let path = draw.path(def.icon[4]);
           path.fill(labelColor);
           path.size(fontSize);
           path.cx(width / 2).cy(height / 2);

           resolve();
       } else {
           // Load font
           let fontFile = path.join(cwd(), "assets/fonts/", fontFamily, fontFamily + "-" + fontStyle + ".ttf");
           TextToSVG.load(fontFile, function (err, textToSvg) {
               if (err) {
                   res.status(400).send("Failed to load font " + fontFamily + " " + fontStyle);
                   reject(err);
                   return console.warn(err);
               }

               let textPath = textToSvg.getPath(label, {
                   x: width / 2,
                   y: height / 2,
                   fontSize: fontSize,
                   anchor: "center middle",
                   attributes: {
                       fill: labelColor
                   }
               });
               draw.svg(textPath);

               resolve();
           });
       }
   })
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

module.exports = {initNewSvg, drawLabel, sendImage};
