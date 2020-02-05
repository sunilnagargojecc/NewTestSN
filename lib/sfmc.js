"use strict"

var async = require("async");
var ET_Client = require("fuelsdk-node");
var jslinq = require("jslinq");
var config = require("./config");
var logger = require("./logger");

function SFMC() {
	this.etClient = new ET_Client(config.get("mcApp.clientId"), config.get("mcApp.clientSecret"), config.get("mcApp.stack"));
}

SFMC.prototype.fireEvent = function(eventDefinitionKey, contactKey, data, callback) {
	var event = {
		ContactKey: contactKey,
		EventDefinitionKey: eventDefinitionKey,
		Data: data	
	};
	var options = {
    	uri: "interaction/v1/events",
    	headers: {},
		body: JSON.stringify(event)	
	};
	this.etClient.RestClient.post(options, function(err, response) {
		if(err) {
			callback(err);
		}
		else {
			callback(null, response.body);
		}
	});	
}

SFMC.prototype.getDataExtensionData = function(name, columns, filter, callback) {
	// https://code.exacttarget.com/apis-sdks/fuel-sdks/data-extension-rows/data-extension-row-retrieve.html
	var options = {
		Name: name,
		props: columns
	};	
	if(filter) {
		options.filter = filter;
	}
	var deRow = this.etClient.dataExtensionRow(options)
	deRow.get(function(err,response) {
		if (err) {
			callback(err);
		} 
		else {
			var results = [];
			var rows = response.body.Results;
			for(var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var result = {};
				for(var x = 0; x < row.Properties.Property.length; x++) {
					var property = row.Properties.Property[x];
					result[property.Name] = property.Value;
				}
				results.push(result);
			}
			callback(null, results);
		}
	});
}

SFMC.prototype.getDataExtension = function(objectId, includeColumns, callback) {
	var self = this;
	var filter = {						
		leftOperand: 'ObjectID',
		operator: 'equals',
		rightOperand: objectId
	};
	self.listDataExtensions(filter, function(err, dataExtensions) {
		var de = dataExtensions[0];
		if(includeColumns === true) {
			self.getDataExtensionColumns(de.customerKey, function(err, columns){
				de.columns = columns;
				callback(err, de);
			});
		}
		else {
			callback(err, de);
		}
	});
}

SFMC.prototype.listDataExtensions = function(filter, callback) {
	// https://code.exacttarget.com/apis-sdks/fuel-sdks/data-extensions/data-extension-retrieve.html#pythonpost
	var options = {
		props: ['ObjectID', 'Name', 'CustomerKey', 'IsSendable', 'CategoryID', 
			'SendableDataExtensionField.Name', 'SendableSubscriberField.Name',
			'Template.CustomerKey', 'Client.ID', 'Status', 'IsPlatformObject']  
	};	
	if(filter) {
		options.filter = filter;
	}
	var de = this.etClient.dataExtension(options);
	de.get(function(err,response) {
		if (err) {
			callback(err);
		} 
		else {
			
			var results = [];
			var items = response.body.Results;
			for(var i = 0; i < items.length; i++) {
				var item = items[i];
				var result = {};
				result.objectId = item.ObjectID;
				result.customerKey = item.CustomerKey;
				result.name = item.Name;
				result.isSendable = item.IsSendable;
				if(item.IsSendable === "true") {
					result.sendableDataExtensionField = item.SendableDataExtensionField.Name;
					result.sendableSubscriberField = item.SendableSubscriberField.Name;
				}
				result.folderId = item.CategoryID;
				results.push(result);
			}
			var query = jslinq(results);
			var filtered = query
				.orderBy(function(el){
					return el.name;
				})
				.toList();
			callback(null, filtered);
		}
	});
}

SFMC.prototype.getDataExtensionColumns = function(customerKey, callback) {
	// https://code.exacttarget.com/apis-sdks/fuel-sdks/data-extension-columns/data-extension-column-retrieve.html
	var options = {
		props: ['DataExtension.CustomerKey', 'ObjectID','PartnerKey','Name','DefaultValue','MaxLength','IsRequired','Ordinal','IsPrimaryKey','FieldType','CreatedDate','ModifiedDate','Scale','Client.ID','CustomerKey']  //required	
		,filter: {
        	leftOperand: 'DataExtension.CustomerKey',
			operator: 'equals',
        	rightOperand: customerKey
   		}
	};	
	var deColumn = this.etClient.dataExtensionColumn(options);
	deColumn.get(function(err,response) {
		if (err) {
			callback(err);
		} 
		else {
			var results = [];
			var items = response.body.Results;
			for(var i = 0; i < items.length; i++) {
				var item = items[i];
				var result = {};
				result.id = item.ObjectID;
				result.name = item.Name;
				result.fieldType = item.FieldType;
				result.isPrimaryKey = item.IsPrimaryKey;
				result.isRequired = item.IsRequired;
				result.ordinal = item.Ordinal;
				results.push(result);
			}
			var query = jslinq(results);
			var filtered = query
				.orderBy(function(el){
					return el.ordinal;
				})
				.toList();	
			callback(null, filtered);
		}
	});
}

SFMC.prototype.getEventColumns = function(eventDefinitionId, callback) {
	var self = this;
	async.waterfall([
		function(callback) {
			self.getEvent(eventDefinitionId, callback);
		},
		function(event, callback) {
			self.getDataExtension(event.dataExtensionId, true, callback);
		},
		function(dataExtension, callback) {
			callback(null, dataExtension.columns);
		},
	], function (err, columns) {
		callback(err, columns);
	});	
}

SFMC.prototype.getEvent = function(eventDefinitionId, callback) {
	var endpoint = "/interaction/v1/eventDefinitions/" + eventDefinitionId;
	this.etClient.RestClient.get(endpoint, function(err, response) {
		if(err) {
			callback(err);
		}	
		else {
			var event = response.body;
			var result = {};
			result.id = event.id;
			result.name = event.name;
			result.description = event.description;
			result.type = event.type;
			result.eventDefinitionKey = event.eventDefinitionKey;
			result.dataExtensionId = event.dataExtensionId;
			result.dataExtensionName = event.dataExtensionName;
			result.interactionCount = event.interactionCount;
			callback(null, result);
		}
	});
}

SFMC.prototype.listEvents = function(callback) {
	var endpoint = "/interaction/v1/eventDefinitions";
	this.etClient.RestClient.get(endpoint, function(err, response) {
		if (err) {
			callback(err);
		} 
		else {
			var results = [];
			var items = response.body.items;
			for(var i = 0; i < items.length; i++) {
				var item = items[i];
				var result = {};
				result.id = item.id;
				result.name = item.name;
				result.description = item.description;
				result.type = item.type;
				result.eventDefinitionKey = item.eventDefinitionKey;
				result.dataExtensionId = item.dataExtensionId;
				result.dataExtensionName = item.dataExtensionName;
				result.interactionCount = item.interactionCount;
				results.push(result);
			}
			var query = jslinq(results);
			var filtered = query
				.orderBy(function(el){
					return el.name;
				})
				.toList();
			callback(null, filtered);
		}
	});
}

SFMC.prototype.getInteractionEventData = function(interactionId, customObjectKey, callback) {
	var self = this;
	async.waterfall([
		function(callback) {
			self.getInteraction(interactionId, callback)
		},
		function(interaction, callback) {
			self.getEvent(interaction.eventDefinitionId, callback);
		},
		function(event, callback) {
			self.getDataExtension(event.dataExtensionId, true, callback);
		},
		function(dataExtension, callback) {
			var columns = columnsToArray(dataExtension.columns);
			var filter =  {
				leftOperand: '_CustomObjectKey',
				operator: 'equals',
				rightOperand: customObjectKey
			}
			self.getDataExtensionData(dataExtension.name, columns, filter, callback);
		},
	], function (err, eventData) {
		callback(err, eventData[0]);
	});	
}

SFMC.prototype.getInteractionColumns = function(interactionId, callback) {
	var self = this;
	async.waterfall([
		function(callback) {
			self.getInteraction(interactionId, callback);
		},
		function(event, callback) {
			self.getEventColumns(event.eventDefinitionId, callback);
		}
	], function (err, columns) {
		callback(err, columns);
	});	
}

SFMC.prototype.getInteraction = function(interactionId, callback) {
	var endpoint = "/interaction/v1/interactions/" + interactionId;
	this.etClient.RestClient.get(endpoint,  function(err, response) {
		if(err) {
			callback(err);
		}	
		else {
			var interaction = response.body;
			var result = {};
			result.id = interaction.id;
			result.name = interaction.name;
			result.eventDefinitionId = interaction.triggers[0].metaData.eventDefinitionId;
			result.eventDefinitionKey = interaction.triggers[0].metaData.eventDefinitionKey;
			callback(null, result);
		}
	});
}

SFMC.prototype.listInteractions = function (callback) {
	var endpoint = "/interaction/v1/interactions";
	this.etClient.RestClient.get(endpoint, function(err, response) {
		if (err) {
			callback(err);
		} 
		else {
			var results = [];
			var items = response.body.items;
			for(var i = 0; i < items.length; i++) {
				var item = items[i];
				var result = {};
				result.id = item.id;
				result.name = item.name;
				result.status = item.status;
				results.push(result);
			}
			var query = jslinq(results);
			var filtered = query
				.orderBy(function(el){
					return el.name;
				})
				.toList();
			callback(null, filtered);
		}
	});
}

function columnsToArray(columns) {
	var result = ["_CustomObjectKey"];
	for(var i = 0; i < columns.length; i++) {
		result.push(columns[i].name);
	}
	return result;
}

module.exports = new SFMC();