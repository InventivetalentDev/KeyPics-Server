import { Router } from "express";
import { HttpError } from "../lib/errors.js";
import { getBackground } from "../lib/backgrounds.js";
import { parseColor, parseFile, query, toCssColor } from "../lib/params.js";
import { Canvas, drawLabel } from "../lib/render.js";
import { checkLabelLength, parseLabelOptions, parseSize, respondWithImage } from "../lib/image-response.js";

const router = Router();

const BUTTON_CLASSES = {
    left: "button_left",
    primary: "button_left",
    right: "button_right",
    secondary: "button_right",
    middle: "wheel",
    wheel: "wheel",
};

router.get("/", (req, res) => {
    res.redirect(`${req.baseUrl}/none`);
});

// GET /mouse/<left|right|middle|none>[.svg|.png]?label=&color=&pressed_color=&outline=&...
router.get("/:file", (req, res) => {
    const start = Date.now();
    const params = req.query;
    const { label: pressed, ext } = parseFile(req.params.file);
    checkLabelLength(pressed);

    const style = query(params, "style") ?? "flat";
    const background = getBackground("mouse", style);
    if (!background) throw new HttpError(404, `No background found for style ${style}`);

    const targetColor = parseColor(query(params, "color") ?? "#565656");
    const pressedColorParam = query(params, "pressed_color", "pressedColor") ?? "auto";
    const pressedColor = pressedColorParam === "auto"
        ? targetColor.negate().grayscale().hex()
        : toCssColor(parseColor(pressedColorParam, "pressed color"));
    const outline = query(params, "outline") !== "false";

    const size = parseSize(params);
    const width = size * 0.625;
    const height = size;

    const label = query(params, "label") ?? "";
    checkLabelLength(label);
    const labelOptions = parseLabelOptions(params, { width, height, targetColor });
    const button = BUTTON_CLASSES[pressed.toLowerCase()];

    const cacheKey = JSON.stringify([
        "mouse", ext, button ?? null, style, toCssColor(targetColor), pressedColor, outline, size, label, labelOptions,
    ]);

    respondWithImage(res, { ext, cacheKey, start }, () => {
        const canvas = new Canvas(width, height);
        canvas.addBackground(background);
        canvas.fillClass("background", targetColor.hex());
        if (button) canvas.fillClass(button, pressedColor);
        if (outline) canvas.strokeClass("outline", pressedColor);
        if (label.length > 0) {
            drawLabel(canvas, label, {
                ...labelOptions,
                x: width / 2 + labelOptions.offsetX,
                // Mouse labels sit slightly below the center (about 18px at size 256).
                y: height / 2 + labelOptions.offsetY + height * 0.07,
            });
        }
        return canvas;
    });
});

export default router;
