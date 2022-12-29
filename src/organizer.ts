import winston from 'winston';

/** The class that uniform and select the dates of the files */
export class Organizer {
  /**
   *  Constructor
   *  @param logger the logger instance
   */
  constructor(private logger: winston.Logger) {}

  /**
   * Initialize the singleton
   * @param logger the logger instance
   */
  static launch(logger: winston.Logger) {
    organizer = new Organizer(logger);
  }

  /**
   * Check the files of the downloader list that should be uploaded
   * @param downloaderList the downloader list
   * @param storageList the list of the already stored files
   * @returns the list of the indexes and dates of the files to be downloaded
   */
  getIndexes(downloaderList: (string | null)[], storageList: string[]): { index: number; date: Date }[] {
    // Extract the dates from the downloader list entry labels, if valid
    let downloaderListRegex = /(\d{2})-(\d{2})-(\d{4}) .*/;
    let downloaderDates = downloaderList.map((date) => {
      if (date && downloaderListRegex.test(date)) {
        let groups = downloaderListRegex.exec(date)!.map((n) => Number.parseInt(n));
        return new Date(groups[3], groups[1] > 15 ? groups[2] - 1 : groups[2] - 2, groups[1] > 15 ? 15 : 1);
      } else return null;
    });

    // Extract the dates from the storage list file nemaes
    let storageListRegex = /.*_(\d{2})_(\d{2})(_AGG)?\..*/;
    let storageDates = storageList.map((date) => {
      let groups = storageListRegex.exec(date)!.map((n) => {
        if (n == '_AGG') return 15;
        else if (n == undefined) return 1;
        else return Number.parseInt(n);
      });
      return new Date(groups[1] + 2000, groups[2] - 1, groups[3]);
    });

    // Navigate the elaborated downloader list and check if files have already been uploaded
    let indexes: { index: number; date: Date }[] = [];
    for (let downloaderIndex = 0; downloaderIndex < downloaderDates.length; downloaderIndex++) {
      if (downloaderDates[downloaderIndex] == null) continue;
      let alreadyDownloaded = false;
      for (let storageIndex = 0; storageIndex < storageDates.length; storageIndex++) {
        if (downloaderDates[downloaderIndex]!.getTime() == storageDates[storageIndex].getTime()) {
          alreadyDownloaded = true;
          break;
        }
      }
      if (!alreadyDownloaded)
        indexes.push({
          index: downloaderIndex,
          date: downloaderDates[downloaderIndex]!
        });
    }
    this.logger.info(
      `The following files are not available on storage: ${indexes.map((i) => downloaderList[i.index])}`
    );
    return indexes;
  }
}

/** The singleton instance to be initialized by the @see launch() method */
export let organizer: Organizer | null;
