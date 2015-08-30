var express = require('express');
var compression = require('compression');
var serveStatic = require('serve-static');
var https = require('https');
var http = require('http');
var app = express();

process.on('uncaughtException', UncaughtExceptionHandler);

function UncaughtExceptionHandler(err) {
    console.log("Uncaught Exception Encountered!!");
    console.log("err: ", err);
    console.log("Stack trace: ", err.stack);
    setInterval(function() { }, 1000);
}

console.log('Project Directory: ' + __dirname);

app.use(compression());
app.use(serveStatic(__dirname + '/resources', {'index': ['/pages/template.html', '/pages/template.htm']}));
app.use('/t/', function(req, res) {
	
});

app.use(serveStatic(__dirname + '/misc', {'index': ['/pages/template.html', '/pages/template.htm']}));

// start listening on port 8000
app.listen(80);