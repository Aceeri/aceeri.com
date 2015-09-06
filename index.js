var express = require('express');
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

var template = fs.readFileSync(__dirname + "/pages/templated/template.html", 'utf8'); // gets template for server session (reduces load)

var buttons = [ "Home", "Portfolio", "Blog" ];
var links = [ '/index', '/portfolio', '/blog', '/contact' ];
var button_width = 200;

var button_html = '';
for (var i = 0; i < buttons.length; i++) {
	button_html += "<a name=\"" + buttons[i] + "\" style=\"width: " + button_width + "px; right: calc(50% + " + (buttons.length/2 - i - 1)*button_width + "px);\" href=\"" + links[i] + "\">" + buttons[i] + "</a>";
}
template = template.replace(new RegExp(/<div id="navigation">/), "<div id=\"navigation\">" + button_html);

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
		var ext_pattern = new RegExp(".*(.html)");
		if (url.match(ext_pattern) == undefined) {
			url += ".html";
		}

		content = fs.readFileSync(__dirname + "/pages/templated/" + url, 'utf8');
	} catch (err) {
		content = fs.readFileSync(__dirname + "/pages/404.html", 'utf8');
	}

	return content;
}

function templated_page(req, res) {
	var page = template.toString();
	var content = get_page(req.originalUrl);

	// insert content from page into template
	page = page.replace(new RegExp(/<div id="content">/), "<div id=\"content\">" + content);

	res.writeHead(200, {
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
	//console.log("request: " + req.headers.host + req.originalUrl);

	var subdomain = get_subdomain(req.headers.host);
	if (req.originalUrl == "/robots.txt") {
		res.sendFile(__dirname + "/robots.txt");

	} else if (req.originalUrl == "" || req.originalUrl == "/") {
		res.redirect(301, req.protocol + '://www.' + host + ":" + port + "/index");

	} else if (subdomain === "www") {
		templated_page(req, res);

	} else if (subdomain === "chat") {

	} else {
		res.redirect(301, req.protocol + '://www.' + host + ":" + port + req.originalUrl);
	}
});

app.listen(port);