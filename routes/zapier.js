"use strict";

var express = require("express");
var util = require("util");
var request = require("request");
var _ = require("lodash");
var config = require("../lib/config");
var logger = require("../lib/logger");
var sfmc = require("../lib/sfmc");

var router = express.Router();

router.post("/action", function(req, res, next) {
	logger.debug("zapier:action:\n", JSON.stringify(req.body));
	
	var data = req.body;
	var eventId = data.eventid;
	var contactKey = data.contactKey;
	delete data.eventid;
	delete data.contactKey
	logger.info(JSON.stringify(data));
	sfmc.getEvent(eventId, function(err, event){
		if(err) {
			return next(err);
		}	
		sfmc.fireEvent(event.eventDefinitionKey, contactKey, data, function(err, result){
			if(err) {
				return next(err);
			}
			logger.info(JSON.stringify(result));
			res.json(result);
		})
	});
	
});

router.get("/event", function(req, res, next) {
	sfmc.listEvents(function(err, data) {
		if(err) {
			return next(err);
		}
		var results = [];
		for(var i = 0; i < data.length; i++) {
			var item = data[i];
			var result = {};
			result.id = item.id;
			result.name = item.name;
			results.push(result);
		}
		res.json(results);
	});	
});

router.get("/event/:id/action/fields", function(req, res, next) {
	var id = req.params.id;
	logger.debug(id);
	sfmc.getEventColumns(id, function(err, data) {
		if(err) {
			return next(err);
		}
		var results = [];
		
		var contactKey = {};
		contactKey.key = "contactKey";
		contactKey.required = true;
		contactKey.label = "Contact Key";
		contactKey.type = "unicode";
		results.push(contactKey);
		
		for(var i = 0; i < data.length; i++) {
			var item = data[i];
			var field = columnToZapierActionField(item);
			results.push(field);
		}
		res.json(results);
		//res.json(data);
	});	
});

router.get("/event/:id/trigger/fields", function(req, res, next) {
	var id = req.params.id;
	logger.debug(id);
	sfmc.getEventColumns(id, function(err, data) {
		if(err) {
			return next(err);
		}
		var results = [];
		for(var i = 0; i < data.length; i++) {
			var item = data[i];
			var field = columnToZapierTriggerField(item);
			results.push(field);
		}
		res.json(results);
		//res.json(data);
	});	
});

router.get("/eventdefinitions", function(req, res, next) {
	sfmc.listEvents(function(err, data) {
		if(err) {
			return next(err);
		}
		res.json(data);
	});	
});

router.post("/execute", function(req, res, next) {
	logger.debug("zapier:execute:\n", JSON.stringify(req.body));
	var activity = req.body;
	var contactKey = activity.inArguments[0].contactKey;
	var email = activity.inArguments[0].email;
	var customObjectKey = activity.inArguments[0].customObjectKey;
	var webhookUrl = activity.inArguments[0].webhookUrl;
	var interactionId = activity.journeyId;
	sfmc.getInteractionEventData(interactionId, customObjectKey, function(err, data) {
		if(err) {
			return next(err);
		}
		//logger.debug("interaction data:\n", JSON.stringify(data));	
		executeHttpRequest(webhookUrl, "POST", null, data, "json", 200, function(err, resp, body) {
			if(err) {
				return next(err);
			}
			logger.debug("webhook execute success");
			res.status(200).send("");
		});	
	});
});

router.get("/interaction", function(req, res, next) {
	sfmc.listInteractions(function(err, data) {
		if(err) {
			return next(err);
		}
		var results = [];
		for(var i = 0; i < data.length; i++) {
			var item = data[i];
			var result = {};
			result.id = item.id;
			result.name = item.name;
			results.push(result);
		}
		res.json(results);
	});	
});

router.get("/interaction/:id/action/fields", function(req, res, next) {
	var id = req.params.id;
	sfmc.getInteractionColumns(id, function(err, data) {
		if(err) {
			return next(err);
		}
		var results = [];
		
		var contactKey = {};
		contactKey.key = "contactKey";
		contactKey.required = true;
		contactKey.label = "Contact Key";
		contactKey.type = "unicode";
		results.push(contactKey);
		
		for(var i = 0; i < data.length; i++) {
			var item = data[i];
			var field = columnToZapierActionField(item);
			results.push(field);
		}
		res.json(results);
		//res.json(data);
	});	
});

router.get("/interaction/:id/trigger/fields", function(req, res, next) {
	var id = req.params.id;
	sfmc.getInteractionColumns(id, function(err, data) {
		if(err) {
			return next(err);
		}
		var results = [];
		for(var i = 0; i < data.length; i++) {
			var item = data[i];
			var field = columnToZapierTriggerField(item);
			results.push(field);
		}
		res.json(results);
		//res.json(data);
	});	
});

router.post("/publish", function(req, res, next) {
	logger.debug("zapier:publish:", util.inspect(req.body));
	res.status(200).send("");
});

router.post("/save", function(req, res, next) {
	logger.debug("zapier:save:", util.inspect(req.body));
	res.status(200).send("");
});

router.post("/validate", function(req, res, next) {
	logger.debug("zapier:validate:", util.inspect(req.body));
	res.status(200).send("");
});

function columnToZapierActionField(column) {
	//https://zapier.com/developer/documentation/v2/action-fields-custom/
	//https://zapier.com/developer/documentation/v2/field-types/
	var field = {};
	field.key = column.name;
	field.required = (column.isRequired === "true");
	field.label = column.name;
	switch(column.fieldType) {
		case "Text":
			field.type = "unicode";
			break;  
		case "Number":
			field.type = "int";
			break;
		case "Date":
			field.type = "datetime";
			break;
		case "Boolean":
			field.type = "bool";
			break;
		case "EmailAddress":	
			field.type = "unicode";
			break;
		case "Phone":
			field.type = "unicode";
			break;
		case "Decimal":
			field.type = "decimal";
			break;
	}
	return field;
}

function columnToZapierTriggerField(column) {
	var field = {};
	field.type = "unicode";
	field.key = column.name;
	field.required = (column.isRequired === "true");
	field.label = column.name;
	return field;
}

function executeHttpRequest(url, method, headers, data, dataType, expectedStatusCode, callback) {
	var defaultHeaders = {
		'User-Agent': 'sfmc-activity-zapier'
	};
	if(headers) {
		_.merge(defaultHeaders, headers);
	}
	var options = {
		url: url,
		method: method,
		headers: defaultHeaders
	};
	if(data) {
		if(dataType === 'json') {
			options.json = data;
		}
		else if (dataType === 'xml') {
			defaultHeaders['Content-Type'] = 'application/xml';
			options.body = data;
		}
		else if (dataType === 'form') {
			options.form = data;
		}
		else {
			defaultHeaders['Content-Type'] = 'text/plain';
			options.body = data;
		}
	}
	request(options, function (err, resp, body) {	
		if(!err) {
			if(resp.statusCode === expectedStatusCode) {
				callback(err, resp, body);
			}
			else {
				callback(new Error('Invalid Status Code: ' + resp.statusCode));
			}
		}
		else {
			callback(err);
		}
	});
}

module.exports = router;