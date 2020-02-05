"use strict";

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var util = require("util");
var config = require("./lib/config");
var logger = require("./lib/logger");
var routes = require("./routes");
var event = require("./routes/event");
var webhook = require("./routes/webhook");
var zapier = require("./routes/zapier");

var app = express();

// app configuration
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routing
app.use("/", routes);
app.use("/event", event);
app.use("/webhook", webhook);
app.use("/zapier", zapier);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    logger.info("404 Handlder");
	logger.debug(util.inspect(req));
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// development error handler
if (config.get("env") === "development") {
	app.use(function(err, req, res, next) {
        logger.info("Err Handler");
		logger.error(err);
		res.status(err.status || 500);
		if(req.accepts("html") === "html") {
			res.render("error", {
				message: err.message,
				error: err
			});
		}
		else {
			res.json( {
				message: err.message,
				error: err
			});
		}
	});
}

// production error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	logger.error(err);
	if(req.accepts("html") === "html") {
		res.render("error", {
			message: err.message,
			error: err
		});
	}
	else {
		res.json( { message: err.message });
	}
});

// launch the app server
app.listen(config.get("port"), function(){
	logger.info("Server listening on port " + config.get("port"));
})