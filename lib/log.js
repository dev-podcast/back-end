var winston = require('winston');

winston.addColors({
  debug: "green",
  info: "cyan",
  silly: "magenta",
  warn: "yellow",
  error: "red"
});

var logger = new (winston.Logger) ({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({filename: 'activity.log', colorize: true})
  ]
});


logger.setLevels({
  debug: 0,
  info: 1,
  silly: 2,
  warn: 3,
  error: 4
});






module.exports = logger;