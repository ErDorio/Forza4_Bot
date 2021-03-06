const express = require('express');
const bodyParser = require('body-parser');
const packageInfo = require('./package.json');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({ version: packageInfo.version })
});

// hosting server on port: 0.0.0.0
var server = app.listen(process.env.PORT, "0.0.0.0", () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Started server at ' + host + ':' + port);
});

module.exports = (bot) => {
    app.post('/' + bot.token, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    })
};