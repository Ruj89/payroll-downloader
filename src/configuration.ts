import * as dotenv from 'dotenv'
import winston from 'winston'

export class Configuration {
  constructor(private logger: winston.Logger) {
    logger.configure({
      level: process.env.LOG_LEVEL ?? 'debug',
      transports: logger.transports,
    })
    logger.info(`Log level set as ${logger.level}`)
  }

  static launch(logger: winston.Logger) {
    dotenv.config()
    configuration = new Configuration(logger)
  }
}
let configuration: Configuration | null = null
export default configuration
