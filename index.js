var express = require('express');
//var connect = require('connect');
var compression = require('compression');
var serve_static = require('serve-static');
var https = require('https');
var http = require('http');
var vhost = require('vhost');
var fs = require('fs');
var app = express();

var output = true;
var host = fs.readFileSync("../host.txt");
var port = (host == "localhost") ? 8000 : 80;

var template = fs.readFileSync(__dirname + "/pages/templated/template.html"); // gets template for server session (reduces load)

process.on('uncaughtException', UncaughtExceptionHandler);

function UncaughtExceptionHandler(err) {
    console.log("err: ", err);
    console.log("Stack trace: ", err.stack);
    setInterval(function() { }, 1000);
}

console.log("Dir: " + __dirname);
console.log("Host: " + host);
console.log("Port: " + port);
console.log("Template: " + (template != undefined));

function get_page(url) {
	var content;
	try {
		content = fs.readFileSync(__dirname + "/pages/templated/" + url);
	} catch (err) {
		console.log("404");
		content = fs.readFileSync(__dirname + "/pages/404.html");
	}

	return content;
}

function templated_page(req, res) {
	var page = template.toString();
	var content = get_page(req.originalUrl);

	page = page.replace(new RegExp(/<div id="content">/), "<div id=\"content\">" + content);

	res.writeHead(200, {
		'Content-Length': page.length,
		'Content-Type': 'text/html' });
	res.write(page);
	res.end();
}

// returns subdomain
function get_subdomain(url) {
	var pattern = new RegExp('(.*.?)' + host);
	var match = url.match(pattern);

	return match == undefined ? "" : match[1].slice(0, match[1].length - 1);
}

function not_found(req, res) {

}

app.use(vhost(host, function(req, res) {
	if (subdomain(req.headers.host) == "") {
		console.log("redirect to www.host: " + req.protocol + '://www.' + host + ":" + port + req.originalUrl);
		res.redirect(301, req.protocol + '://www.' + host + ":" + port + req.originalUrl);
	}
}));

app.use('/r/', serve_static(__dirname + "/resources/"));
app.use('/m/', serve_static(__dirname + "/pages/misc/"));
app.get('/*', function(req, res) {
	console.log("request: " + req.headers.host + req.originalUrl);

	var subdomain = get_subdomain(req.headers.host);
	if (subdomain === "www") {
		console.log("template domain");

		templated_page(req, res);
	} else if (subdomain === "chat") {
		console.log("chat domain");

		// 404 until created
		not_found(req, res);
	}

	// no subdomains found
	not_found(req, res);
});

app.listen(port);