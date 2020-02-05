"use strict";

var path = require("path");
var convict = require("convict");
var defaultConfig = require("../config/default");

var config = convict(defaultConfig);
var env = config.get("env");
config.loadFile(path.normalize("./config/" + env + ".json"));
config.validate();

module.exports = config;