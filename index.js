var express = require('express');
//var connect = require('connect');
var compression = require('compression');
var serve_static = require('serve-static');
var https = require('https');
var http = require('http');
var vhost = require('vhost');
var fs = require('fs');
//var Iconv = require('iconv').Iconv;
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
	if (url == "/" || url == "") {
		url = "/index.html";
	}

	var content;
	try {
		content = fs.readFileSync(__dirname + "/pages/templated/" + url);
	} catch (err) {
		content = fs.readFileSync(__dirname + "/pages/404.html");
	}

    //iconv = new Iconv("UTF-16", "UTF-8");
    //content = iconv.convert(content).toString("utf8");

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
	var pattern_string;
	if (host == 'localhost') {
		pattern_string = /(.*.?)localhost/;
	} else {
		pattern_string = /(.*.?)aceeri.com/;
	}
	var pattern = new RegExp(pattern_string);
	var match = url.match(pattern);

	return match == undefined ? "" : match[1].slice(0, match[1].length - 1);
}

app.use('/r/', serve_static(__dirname + "/resources/"));
app.use('/', serve_static(__dirname + "/pages/misc/", { 'extensions': [ 'html', 'htm' ]}));
app.get('/*', function(req, res) {
	console.log("request: " + req.headers.host + req.originalUrl);

	var subdomain = get_subdomain(req.headers.host);

	if (req.originalUrl == "/robots.txt") {
		res.sendFile(__dirname + "/robots.txt");

	} else if (subdomain === "www") {
		templated_page(req, res);

	} else if (subdomain === "chat") {


	} else {
		res.redirect(301, req.protocol + '://www.' + host + ":" + port + req.originalUrl);
	}
});

app.listen(port);