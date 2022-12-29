import winston from 'winston';

/** Generate the logger */
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/** The logger instance */
export default logger;
