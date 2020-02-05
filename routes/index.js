"use strict";

var express = require("express");
var util = require("util");
var config = require("../lib/config");
var logger = require("../lib/logger");
var router = express.Router();

router.get("/", function(req, res, next) {
	logger.debug("index");
	res.render("index", { title: "Zapier JourneyBuilder Activity" });
});

router.post("/login", function(req, res, next) {
	logger.debug("login", util.inspect(req.body));
	res.status(200).send("");
});

router.get("/logout", function(req, res, next) {
	logger.debug("logout");
	res.status(200).send("");
});

module.exports = router;