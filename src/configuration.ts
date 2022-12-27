import * as dotenv from 'dotenv'
import winston from 'winston'

interface PortalConfiguration {
  username: string
  password: string
}

export class ConfigurationError extends Error {}

export class Configuration {
  portal: PortalConfiguration = {
    username: process.env.PORTAL_USERNAME ?? 'unset',
    password: process.env.PORTAL_PASSWORD ?? 'unset',
  }

  constructor(public logger: winston.Logger) {
    if (!process.env.PORTAL_USERNAME)
      throw new ConfigurationError('Portal username not set')
    if (!process.env.PORTAL_PASSWORD)
      throw new ConfigurationError('Portal password not set')

    logger.level = process.env.LOG_LEVEL ?? 'debug'
    logger.transports.forEach((transport) => (transport.level = logger.level))
  }

  static launch(logger: winston.Logger) {
    dotenv.config()
    configuration = new Configuration(logger)
    configuration.logger.info(`Log level set as ${configuration?.logger.level}`)
  }
}

export let configuration: Configuration | null
