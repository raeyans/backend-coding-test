const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.splat(), winston.format.simple()),
    transports: [ new winston.transports.File({ filename: 'error.log', level: 'error' }) ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.splat(), winston.format.simple()),
    }));
}

module.exports = logger;
