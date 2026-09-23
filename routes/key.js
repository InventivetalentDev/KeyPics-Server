import { Router } from "express";
import { HttpError } from "../lib/errors.js";
import { getBackground } from "../lib/backgrounds.js";
import { parseColor, parseFile, query, toCssColor } from "../lib/params.js";
import { Canvas, drawLabel } from "../lib/render.js";
import { checkLabelLength, parseLabelOptions, parseSize, respondWithImage } from "../lib/image-response.js";

const router = Router();

// GET /key/<label>[.svg|.png]?shape=&style=&color=&size=&label_color=&...
router.get("/:file", (req, res) => {
    const start = Date.now();
    const params = req.query;
    const { label, ext } = parseFile(req.params.file);
    checkLabelLength(label);

    const shape = query(params, "shape") ?? "square";
    const style = query(params, "style") ?? "classic";
    const background = getBackground("key", shape, style);
    if (!background) throw new HttpError(404, `No background found for shape ${shape}, style ${style}`);

    const targetColor = parseColor(query(params, "color") ?? "#565656");
    const size = parseSize(params);
    let width = size;
    let height = size;
    if (shape === "wide") height = size / 2;
    else if (shape === "tall") width = size / 2;

    const labelOptions = parseLabelOptions(params, { width, height, targetColor });
    const cacheKey = JSON.stringify(["key", ext, label, shape, style, toCssColor(targetColor), size, labelOptions]);

    respondWithImage(res, { ext, cacheKey, start }, () => {
        const canvas = new Canvas(width, height);
        canvas.addBackground(background);
        canvas.fillClass("background", targetColor.hex());
        canvas.fillClass("light_shadow", targetColor.lighten(0.02).hex());
        canvas.fillClass("dark_shadow", targetColor.darken(0.17).hex());
        const lineColor = targetColor.isDark() ? targetColor.darken(0.5) : targetColor.lighten(0.5);
        canvas.strokeClass("front_line", lineColor.hex());
        drawLabel(canvas, label, {
            ...labelOptions,
            x: width / 2 + labelOptions.offsetX,
            y: height / 2 + labelOptions.offsetY,
        });
        return canvas;
    });
});

export default router;
