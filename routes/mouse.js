const path = require("path");
const fs = require("fs");
const cwd = require("process").cwd;

const Color = require("color");
const util = require("../util");


module.exports = function (express, config) {
    let router = express.Router();

    router.get("/", (req, res) => {
        res.redirect("none");
    });

    router.get("/:pressed*(\.:ext)?", (req, res) => {
        let start = Date.now();

        let pressed = req.params.pressed;

        let ext = req.params.ext || "svg";
        if (ext !== "svg" && ext !== "png") {
            res.status(400).send("Unsupported format: " + ext);
            return;
        }

        let style = req.query.style || "flat";
        let color = req.query.color || "#565656";
        let pressedColor = req.query.pressed_color || req.query.pressedColor || "auto";
        let outline = req.query.outline !== "false";

        if (color === "dark") {
            color = "#565656";
        } else if (color === "light") {
            color = "#dbdbdb";
        }

        let size = parseInt(req.query.size || "256") || 256;
        let width = size * 0.625;
        let height = size;

        let label = req.query.label || "";
        let labelColor = req.query.label_color || req.query.labelColor || "auto";
        let labelOffsetX = parseInt(req.query.label_offset_x || req.query.labelOffsetX || "0") || 0;
        let labelOffsetY = parseInt(req.query.label_offset_y || req.query.labelOffsetY || "0") || 0;

        let fontFamily = req.query.font_family || req.query.fontFamily || req.query.font || "OpenSans";
        let fontStyle = req.query.font_style || req.query.fontStyle || "Regular";
        let fontSize = parseInt(req.query.font_size || req.query.fontSize || String(Math.min(width, height) / 2)) || (Math.min(width, height) / 2);


        let file = path.join(cwd(), "assets/bg/mouse/", style + ".svg");
        if (!fs.existsSync(file)) {
            res.status(404).send("No background found for style " + style);
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
            if (pressedColor === "auto") {
                pressedColor = targetColor.negate().grayscale().hex();
            }
            // Adjust label color if set to auto
            if (labelColor === "auto") {
                labelColor = targetColor.negate().grayscale().hex();
            }
            // Adjust background colors
            draw.select(".background").fill(targetColor.hex());

            if (pressed === "left" || pressed === "primary") {
                draw.select(".button_left").fill(pressedColor);
            } else if (pressed === "right" || pressed === "secondary") {
                draw.select(".button_right").fill(pressedColor);
            } else if (pressed === "middle" || pressed === "wheel") {
                draw.select(".wheel").fill(pressedColor);
            }

            if (outline) {
                draw.select(".outline").stroke(pressedColor);
            }

            function svgDone() {
                let svgString = draw.node.outerHTML;
                // Clear when done
                draw.clear();

                res.set({
                    "X-Gen-Duration": (Date.now() - start)
                });
                util.sendImage(svgString, ext, res);
            }

            if (label && label.length > 0) {
                // move down mouse labels down 20 by default
                labelOffsetY += 20;
                util.drawLabel(draw, label, width, height, labelOffsetX, labelOffsetY, fontFamily, fontStyle, fontSize, labelColor, res)
                    .then(svgDone);
            } else {
                svgDone();
            }
        });


    });

    return router;
};