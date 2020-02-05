"use strict";

var express = require("express");
var util = require("util");
var config = require("../lib/config");
var logger = require("../lib/logger");
var sfmc = require("../lib/sfmc");

var router = express.Router();

router.post("/fire", function(req, res, next) {
	logger.debug("event:fire:request", util.inspect(req.body));
	
	var postData = req.body;
	var eventDefinitionKey = postData.EventDefinitionKey;
	var contactKey = postData.ContactKey;
	var data = postData.Data;
	
	sfmc.fireEvent(eventDefinitionKey, contactKey, data, function(err, response) {
		if(err) {
			next(err);
			return;
		}
		res.json(response);
	});
	
});

module.exports = router;