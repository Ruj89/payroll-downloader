import { CloudStorage, cloudStorage } from './cloudstorage'
import {
  Configuration,
  configuration,
  ConfigurationError,
} from './configuration'
import { downloader, Downloader } from './downloader'
import logger from './logger'

/**
 * Main process
 */
async function main() {
  // Launch the configuration process
  Configuration.launch(logger)
  configuration?.logger.debug(
    'Environment setup completed, starting the process',
  )

  // Launch the downloader process
  Downloader.launch(logger)
  await downloader?.download()

  // Launch the organizer process
  // TODO

  // Launch the storage process
  CloudStorage.launch(logger)
  await cloudStorage?.list()
}

main()
  .catch((e) => {
    if (e instanceof ConfigurationError) logger.error(e.stack)
    else configuration?.logger.error(e.stack)
  })
  .finally(() => {
    process.exit()
  })
