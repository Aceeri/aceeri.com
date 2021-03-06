var express = require('express');
var compression = require('compression');
var serve_static = require('serve-static');
var https = require('https');
var http = require('http');
var vhost = require('vhost');
var util = require('utility');
//var temp = require('template');
var fs = require('fs');
var app = express();

process.on('uncaughtException', UncaughtExceptionHandler);

function UncaughtExceptionHandler(err)
{
    console.log("Uncaught Exception Encountered!!");
    console.log("err: ", err);
    console.log("Stack trace: ", err.stack);
    setInterval(function(){}, 1000);
}

var output = true;

var template = fs.readFileSync(__dirname + "/pages/templated/template.html", 'utf8'); // gets template for server session (reduces load)

var buttons = [ "Home", "Portfolio", "Blog", "Misc" ];
var links = [ '/index', '/portfolio', '/blog', "/misc" ];
var button_width = 150;

var button_html = '';
for (var i = 0; i < buttons.length; i++) {
	button_html += "<a name=\"" + buttons[i] + "\" style=\"width: " + button_width + "px; right: calc(50% + " + (buttons.length/2 - i - 1)*button_width + "px);\" href=\"" + links[i] + "\">" + buttons[i] + "</a>";
}
template = template.replace(new RegExp(/<div id="navigation">/), "<div id=\"navigation\">" + button_html);

console.log("Dir: " + __dirname);
console.log("Host: " + util.host);
console.log("Port: " + util.port);
console.log("Template: " + (template != undefined));

function get_page(url, callback) {
	var ext_pattern = new RegExp(".*(.html)");
	if (url.match(ext_pattern) == undefined) {
		url += ".html";
	}

	return fs.readFile(__dirname + "/pages/templated/" + url, 'utf8', callback);
}

function insert_content(req, res, data) {
	// insert content from page into template
	var page = template.toString();
	page = page.replace(new RegExp(/<div id="content">/), "<div id=\"content\">" + data);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
}

function templated_page(req, res, path) {
	if (path == "") {
		path = req.originalUrl;
	}

	get_page(path, function(err, data) {
		if (err) { 
			get_page("../404", function(err, data) {
				insert_content(req, res, data);
			});
		} else {
			insert_content(req, res, data);
		}
	});
}

function route(url) {
	var project = url.match(new RegExp(/\/project\/(.*)/));
	var blog = url.match(new RegExp(/\/post\/(.*)/));

	if (project != null && project[1] != null) {
		return "project.html";
	}

	var blog = url.match(new RegExp(/\/post\/(.*)/));
	if (blog != null && blog[1] != null) {
		return "blog.html";
	}

	return "";
}

// serves resources (img, css, js)
app.use('/r/', serve_static(__dirname + "/resources/", { 'fallthrough': 'false', 'extensions': [ 'png', 'jpg', 'json' ]}));

// serve static pages, redirects to www if missing
app.use('/', serve_static(__dirname + "/pages/misc/", { 'extensions': [ 'html', 'htm' ]}));

// routes subdomains to proper
app.get('/*', function(req, res) {
	var subdomain = util.subdomain(req.headers.host);
	if (req.originalUrl === "/robots.txt") {
		res.sendFile(__dirname + "/robots.txt");

	} else if (req.originalUrl == "" || req.originalUrl == "/") {
		res.redirect(301, req.protocol + '://www.' + util.host + ":" + util.port + "/index");

	} else if (subdomain === "www") {
		var path = route(req.originalUrl);
		templated_page(req, res, path);

	} else if (subdomain === "chat") {

	} else {
		util.redirect_www(req, res);
	}
});

app.listen(util.port);