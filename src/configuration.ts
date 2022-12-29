import * as dotenv from 'dotenv';
import winston from 'winston';

/** The portal configuration */
interface PortalConfiguration {
  username: string; ///< The username to be used to log in
  password: string; ///< The password to be used to log in
}
/** The Google Drive configuration */
interface GoogleDriveConfiguration {
  folderId: string; ///< The Google Drive folder identifier
  fileNamePrefix: string; ///< The prefix to be happened when files have to be uploaded
}

/** The custom configuration error */
export class ConfigurationError extends Error {}

/** The configuration class */
export class Configuration {
  /** The portal configuration instance */
  portal: PortalConfiguration = {
    username: process.env.PORTAL_USERNAME ?? 'unset',
    password: process.env.PORTAL_PASSWORD ?? 'unset'
  };
  /** The Google Drive configuration instance */
  googleDrive: GoogleDriveConfiguration = {
    folderId: process.env.GOOGLE_DRIVE_FOLDER ?? 'unset',
    fileNamePrefix: process.env.GOOGLE_DRIVE_FILE_PREFIX ?? 'unset'
  };

  /**
   *  Constructor
   *  @param logger the logger instance
   */
  constructor(public logger: winston.Logger) {
    // Check if every configuration entry needed is set
    if (!process.env.PORTAL_USERNAME) throw new ConfigurationError('Portal username not set');
    if (!process.env.PORTAL_PASSWORD) throw new ConfigurationError('Portal password not set');
    if (!process.env.GOOGLE_DRIVE_FOLDER) throw new ConfigurationError('Google Drive folder ID not set');
    if (!process.env.GOOGLE_DRIVE_FILE_PREFIX)
      throw new ConfigurationError('Google Drive file name prefix not set');

    // Set the log level
    logger.level = process.env.LOG_LEVEL ?? 'debug';
    logger.transports.forEach((transport) => (transport.level = logger.level));
  }

  /**
   * Initialize the singleton
   * @param logger the logger instance
   */
  static launch(logger: winston.Logger) {
    // Import the environment configuration
    dotenv.config();

    configuration = new Configuration(logger);
    configuration.logger.info(`Log level set as ${configuration?.logger.level}`);
  }
}

/** The singleton instance to be initialized by the @see launch() method */
export let configuration: Configuration | null;
