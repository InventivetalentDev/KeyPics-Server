const path = require("path");
const fs = require("fs");
const cwd = require("process").cwd;

const TextToSVG = require("text-to-svg");
const Color = require("color");
const util = require("../util");

const faCore = require('@fortawesome/fontawesome-svg-core');
const faRegular = require('@fortawesome/free-regular-svg-icons');
const faSolid = require('@fortawesome/free-solid-svg-icons');
const faBrands = require('@fortawesome/free-brands-svg-icons');

module.exports = function (express, config) {
    let router = express.Router();

    faCore.library.add(faRegular.far, faSolid.fas, faBrands.fab);

    router.get("/:label*(\.:ext)?", (req, res) => {
        let start = Date.now();

        let label = req.params.label;

        let ext = req.params.ext || "svg";
        if (ext !== "svg" && ext !== "png") {
            res.status(400).send("Unsupported format: " + ext);
            return;
        }

        let shape = req.query.shape || "square";
        let style = req.query.style || "classic";
        let color = req.query.color || "#565656";

        if (color === "dark") {
            color = "#565656";
        } else if (color === "light") {
            color = "#dbdbdb";
        }

        let size = parseInt(req.query.size || "256") || 256;
        let width = size;
        let height = size;
        if (shape === "wide") {
            height = width / 2;
        } else if (shape === "tall") {
            width = height / 2;
        }

        let labelColor = req.query.label_color || req.query.labelColor || "auto";

        let fontFamily = req.query.font_family || req.query.fontFamily || req.query.font || "OpenSans";
        let fontStyle = req.query.font_style || req.query.fontStyle || "Regular";
        let fontSize = parseInt(req.query.font_size || req.query.fontSize || String(Math.min(width, height) / 2)) || (Math.min(width, height) / 2);


        let file = path.join(cwd(), "assets/bg/key/", shape, style + ".svg");
        if (!fs.existsSync(file)) {
            res.status(404).send("No background found for shape " + shape + ", style " + style);
            return;
        }


        fs.readFile(file, "utf8", (err, data) => {
            if (err) {
                res.status(500).send("Failed to load background image");
                return console.error(err);
            }

            let draw = util.initNewSvg(width, height);

            // Draw Background
            draw.svg(data);

            let targetColor;
            try {
                targetColor = Color(color);
            } catch (e) {
                console.warn(e);
                res.status(400).send("Could not parse color " + color);
                return;
            }
            // Adjust label color if set to auto
            if (labelColor === "auto") {
                labelColor = targetColor.negate().grayscale().hex();
            }
            // Adjust background colors
            draw.select(".background").fill(targetColor.hex());
            draw.select(".light_shadow").fill(targetColor.lighten(0.02).hex());
            draw.select(".dark_shadow").fill(targetColor.darken(0.17).hex());
            if (targetColor.isDark()) {
                draw.select(".front_line").stroke(targetColor.darken(0.5).hex());
            } else {
                draw.select(".front_line").stroke(targetColor.lighten(0.5).hex());
            }

            // Load font
            let fontFile = path.join(cwd(), "assets/fonts/", fontFamily, fontFamily + "-" + fontStyle + ".ttf");


            function svgDone() {
                let svgString = draw.node.outerHTML;
                // Clear when done
                draw.clear();

                res.set({
                    "X-Gen-Duration": (Date.now() - start)
                });
                util.sendImage(svgString, ext, res);
            }

            if (label.startsWith("far:") || label.startsWith("fas:") || label.startsWith("fab:")) {
                let split = label.split(":");
                let prefix = split[0];
                let iconName = split[1];

                let def = faCore.findIconDefinition({prefix: prefix, iconName: iconName});
                if (!def) {
                    res.status(400).send("Unknown icon " + prefix + ":" + iconName);
                    return;
                }
                let path = draw.path(def.icon[4]);
                path.fill(labelColor);
                path.size(fontSize);
                path.cx(width / 2).cy(height / 2);

                svgDone();
            } else {
                TextToSVG.load(fontFile, function (err, textToSvg) {
                    if (err) {
                        res.status(400).send("Failed to load font " + fontFamily + " " + fontStyle);
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

                    svgDone();
                });
            }


        });


    });

    return router;
};