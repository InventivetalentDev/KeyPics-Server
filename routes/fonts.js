import { Router } from "express";
import { HttpError } from "../lib/errors.js";
import { getFamily, listFamilies, listStyles } from "../lib/fonts.js";

const router = Router();

router.use((req, res, next) => {
    res.set("Cache-Control", "public, max-age=3600");
    next();
});

// GET /fonts -> ["Aleo", "OpenSans", ...]
router.get("/", (req, res) => {
    res.json(listFamilies());
});

// GET /fonts/<family> -> license text of the font
router.get("/:family", (req, res) => {
    const family = getFamily(req.params.family);
    if (!family) throw new HttpError(404, "Font not found");
    if (!family.license) throw new HttpError(404, "No license file available for this font");
    res.type("text/plain").sendFile(family.license);
});

// GET /fonts/<family>/styles -> ["Bold", "Regular", ...]
router.get("/:family/styles", (req, res) => {
    const styles = listStyles(req.params.family);
    if (!styles) throw new HttpError(404, "Font not found");
    res.json(styles);
});

export default router;
