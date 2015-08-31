var express = require('express');
var compression = require('compression');
var serveStatic = require('serve-static');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();

var port = 80;
var subdomains = [
	"www",
	"chat"
]
var domain = (port == 8000) ? "localhost:8000" : "aceeri.com";

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

function get_valid_domain(url) {
    var pattern = new RegExp('(.*.?)' + domain);
    var match = url.match(pattern);
    
    for (var i = 0; i < subdomains.length; i++) {
        if (match[1].slice(0, match[1].length - 1) == subdomains[i]) {
            // valid subdomain
            return url;
        }
    }
    
    // not a valid subdomain
    return "www." + url.slice(match[1].length);
}

function redirect(req, res, next) {
	var valid_domain = get_valid_domain(req.headers.host);
	if (valid_domain != req.headers.host) {
		return res.redirect(301, req.protocol + '://' + valid_domain + req.originalUrl);
	}
    next();
};

//app.set('trust proxy', true);
app.use(redirect);

app.use(compression());
app.use('/resources', serveStatic(__dirname + '/resources'));
app.use(serveStatic(__dirname + '/misc', {'index': ['/pages/template.html', '/pages/template.htm']}));
app.get('/', template);

app.listen(port);