const path = require("path");
const fs = require("fs");
const cwd = require("process").cwd;


module.exports = function (express, config) {
    let router = express.Router();

    router.get("/", (req, res) => {
        fs.readdir(path.join(cwd(), "assets/fonts"), (err, files) => {
            if (err) {
                res.status(400).json({err: "No fonts found"});
                return console.warn(err);
            }
            let names = [];
            files.forEach((file) => {
                if (fs.statSync(path.join(cwd(), "assets/fonts", file)).isDirectory()) {
                    names.push(file);
                }
            });
            res.json(names);
        })
    });
    router.get("/:font", (req, res) => {
        let dir = path.join(cwd(), "assets/fonts", req.params.font);
        fs.readdir(dir, (err, files) => {
            if (err) {
                res.status(400).json({err: "Font not found"});
                return console.warn(err);
            }
            for (let i = 0; i < files.length; i++) {
                if (files[i].endsWith(".txt")) {
                    fs.readFile(path.join(dir, files[i]), (err, data) => {
                        if (err) return console.warn(err);
                        res.set({
                            "Content-Type": "text/plain"
                        });
                        res.send(data);
                    });
                    break;
                }
            }
        })
    });
    router.get("/:font/styles", (req, res) => {
        let dir = path.join(cwd(), "assets/fonts", req.params.font);
        fs.readdir(dir, (err, files) => {
            if (err) {
                res.status(400).json({err: "Font not found"});
                return console.warn(err);
            }
            let styles = [];
            files.forEach((file) => {
                if (file.endsWith(".ttf")) {
                    styles.push(file.substr((req.params.font.length + 1)).replace(".ttf", ""));
                }
            });
            res.json(styles);
        })
    });

    return router;
};