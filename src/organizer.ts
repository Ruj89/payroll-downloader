import winston from 'winston'

export class Organizer {
  constructor(private logger: winston.Logger) {}

  static launch(logger: winston.Logger) {
    organizer = new Organizer(logger)
  }

  getIndexes(
    downloaderList: string[],
    storageList: string[],
  ): { index: number; date: Date }[] {
    let downloaderListRegex = /(\d{2})-(\d{2})-(\d{4}) .*/
    let downloaderDates = downloaderList.map((date) => {
      let groups = downloaderListRegex
        .exec(date)!
        .map((n) => Number.parseInt(n))
      return new Date(
        groups[3],
        groups[1] > 15 ? groups[2] - 1 : groups[2] - 2,
        groups[1] > 15 ? 15 : 1,
      )
    })

    let storageListRegex = /.*_(\d{2})_(\d{2})(_AGG)?\..*/
    let storageDates = storageList.map((date) => {
      let groups = storageListRegex.exec(date)!.map((n) => {
        if (n == '_AGG') return 15
        else if (n == undefined) return 1
        else return Number.parseInt(n)
      })
      return new Date(groups[1] + 2000, groups[2] - 1, groups[3])
    })

    let indexes: { index: number; date: Date }[] = []
    for (
      let downloaderIndex = 0;
      downloaderIndex < downloaderDates.length;
      downloaderIndex++
    ) {
      let alreadyDownloaded = false
      for (
        let storageIndex = 0;
        storageIndex < storageDates.length;
        storageIndex++
      ) {
        if (
          downloaderDates[downloaderIndex].getTime() ==
          storageDates[storageIndex].getTime()
        ) {
          alreadyDownloaded = true
          break
        }
      }
      if (!alreadyDownloaded)
        indexes.push({
          index: downloaderIndex,
          date: downloaderDates[downloaderIndex],
        })
    }
    this.logger.info(
      `The following files are not available on storage: ${indexes.map(
        (i) => downloaderList[i.index],
      )}`,
    )
    return indexes
  }
}

export let organizer: Organizer | null
