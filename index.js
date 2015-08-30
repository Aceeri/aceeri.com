var express = require('express');
var compression = require('compression');
var serveStatic = require('serve-static');
var https = require('https');
var http = require('http');
var app = express();

var port = 8000;
var subdomains = [
	"www",
	"chat"
]

process.on('uncaughtException', UncaughtExceptionHandler);

function UncaughtExceptionHandler(err) {
    console.log("Uncaught Exception Encountered!!");
    console.log("err: ", err);
    console.log("Stack trace: ", err.stack);
    setInterval(function() { }, 1000);
}

console.log('Project Directory: ' + __dirname);
console.log('Port: ' + port);

function template(req, res) { res.sendFile(__dirname + "/resources/pages/template.html"); }

function redirect(req, res, next) {
    if (req.headers.host.slice(0, 4) !== 'www.') {
        var newHost = "www." + req.headers.host;
        return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
    }
    next();
};

app.set('trust proxy', true);
app.use(redirect);

app.use(compression());
app.use('/resources', serveStatic(__dirname + '/resources'));
app.use(serveStatic(__dirname + '/misc', {'index': ['/pages/template.html', '/pages/template.htm']}));
app.get('/', template);

app.listen(port);