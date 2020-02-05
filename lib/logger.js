"use strict"

var winston = require("winston");
winston.emitErrs = true;

var logger = new winston.Logger({exitOnError: false});
// add console logger
logger.add(winston.transports.Console,
    {
        level: "debug",
        handleExceptions: true,
        json: false,
        colorize: true,
        timestamp: false
    });

module.exports = logger;

module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
