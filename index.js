var express = require('express');
//var connect = require('connect');
var compression = require('compression');
var serveStatic = require('serve-static');
var https = require('https');
var http = require('http');
var vhost = require('vhost');
var fs = require('fs');
var app = express();

var host = fs.readFileSync("../host.txt");
var port = (host == "localhost") ? 8000 : 80;

process.on('uncaughtException', UncaughtExceptionHandler);

function UncaughtExceptionHandler(err) {
    console.log("Uncaught Exception Encountered!!");
    console.log("err: ", err);
    console.log("Stack trace: ", err.stack);
    setInterval(function() { }, 1000);
}

console.log("Dir: " + __dirname);
console.log("Host: " + host);
console.log("Port: " + port);

function template(req, res) {
	console.log("Getting template with " + req.originalUrl);
	res.sendFile(__dirname + "/pages/template.html");
}

function subdomain(url) {
	var pattern = new RegExp('(.*.?)' + host);
	var match = url.match(pattern);

	return match == undefined ? "" : match[1];
}

app.use(vhost(host, function(req, res) {
	if (subdomain(req.headers.host) == "") {
		console.log("redirect to www.host: " + req.protocol + '://www.' + host + req.originalUrl);
		res.redirect(301, req.protocol + '://www.' + host + ":" + port + req.originalUrl);
	}
}));

app.route(vhost("www." + host, function(req, res) {
	console.log("using correct subdomain");
}));

app.use(compression());
app.use('/resources', serveStatic(__dirname + '/resources'));
app.use('/', serveStatic(__dirname + '/pages', {'extensions': ['html', 'htm']}));
app.get('/*', template);

// 404 page
app.use(function(req, res) {
	res.redirect('/pages/404.html');
});

app.listen(port);