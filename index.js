let express = require('express');
let app = express();
let http = require('http');
let server = http.Server(app);
let config = require("./config");
let port = process.env.PORT || config.port || 8451;


app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
        res.header("Access-Control-Allow-Headers", "X-Requested-With, Accept, Content-Type, Origin");
        res.header("Access-Control-Request-Headers", "X-Requested-With, Accept, Content-Type, Origin");
        return res.sendStatus(200);
    } else {
        return next();
    }
});

app.use("/.well-known", express.static(".well-known"));
app.use("/", express.static("static"));


app.use("/key", require("./routes/key")(express, config));
app.use("/mouse", require("./routes/mouse")(express, config));
app.use("/fonts", require("./routes/fonts")(express, config));


server.listen(port, function () {
    console.log('listening on *:' + port);
});
