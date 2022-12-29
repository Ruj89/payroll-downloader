import { CloudStorage, cloudStorage } from './cloudstorage';
import { Configuration, configuration, ConfigurationError } from './configuration';
import { downloader, Downloader } from './downloader';
import logger from './logger';
import { organizer, Organizer } from './organizer';

/** Main process */
async function main() {
  // Launch the configuration process
  Configuration.launch(logger);
  configuration?.logger.debug('Environment setup completed, starting the process');

  // Launch the downloader process
  Downloader.launch(logger);
  // Launch the storage process
  CloudStorage.launch(logger);
  // Launch the storage process
  Organizer.launch(logger);

  // Check if processes are started correctly
  if (!downloader) throw new Error('Downloaded not started correctly');
  if (!cloudStorage) throw new Error('Cloud storage not started correctly');
  if (!organizer) throw new Error('Organizer not started correctly');

  // List the last available elements to be downloaded
  let downloaderList = await downloader.list();
  // List the last synchonized elements
  let storageList = await cloudStorage.list();

  // Launch the organizer process
  let toBeDownloadedIndexes = organizer.getIndexes(downloaderList, storageList);

  // Download the missing files
  await downloader.downloadAll(toBeDownloadedIndexes.map((i) => i.index));

  // Upload the downloaded files
  await cloudStorage.uploadAll(toBeDownloadedIndexes);
}

/** An error that needs to be throwed */
let unexpectedError: Error | undefined;
main()
  .catch((e) => {
    if (e instanceof ConfigurationError) logger.error(e.stack);
    else unexpectedError = <Error>e;
  })
  .finally(() => {
    if (unexpectedError) throw unexpectedError;
    process.exit();
  });
