import { createReadStream } from 'fs'
import { unlink } from 'fs/promises'
import { Auth, drive_v3, google } from 'googleapis'
import winston from 'winston'
import * as keys from '../googleapi.json'
import { configuration } from './configuration'

export class CloudStorage {
  private client: Auth.JWT
  private drive: drive_v3.Drive | undefined

  constructor(private logger: winston.Logger) {
    this.client = new google.auth.JWT(
      keys.client_email,
      undefined,
      keys.private_key,
      ['https://www.googleapis.com/auth/drive'],
    )
  }

  static async launch(logger: winston.Logger) {
    cloudStorage = new CloudStorage(logger)
  }

  private async authorize() {
    if (this.drive) return
    await this.client.authorize()
    this.drive = google.drive({ version: 'v3', auth: this.client })
  }

  async list(): Promise<string[]> {
    await this.authorize()
    const response = await this.drive!.files.list({
      pageSize: 100,
      fields: 'nextPageToken, files(name)',
      orderBy: 'createdTime desc',
      q: `trashed = false and '${configuration?.googleDrive
        .folderId!}' in parents`,
    })
    const files = response.data.files
    if (files?.length) {
      let result = files
        .map((file) => file.name!)
        .filter((n) => n.startsWith(configuration?.googleDrive.fileNamePrefix!))
      this.logger.debug(`Files: ${result.join(' ')}`)
      return result
    } else {
      this.logger.debug('No files found.')
    }
    return []
  }

  async upload(toBeDownloadedIndexes: { index: number; date: Date }[]) {
    await this.authorize()
    await Promise.all(
      toBeDownloadedIndexes.map(async (entry) => {
        const localFile = `output${entry.index}.pdf`
        const remoteFile = `${configuration?.googleDrive
          .fileNamePrefix!}_${String(entry.date.getFullYear() - 2000).padStart(
          2,
          '0',
        )}_${String(entry.date.getMonth() + 1).padStart(2, '0')}${
          entry.date.getDate() >= 15 ? '_AGG' : ''
        }.pdf`
        this.logger.debug(`Uploading file ${localFile} to ${remoteFile}`)
        await this.drive!.files.create({
          media: {
            body: createReadStream(localFile),
          },
          fields: 'id',
          requestBody: {
            name: remoteFile,
            parents: [configuration?.googleDrive.folderId!],
          },
        })
        await unlink(localFile)
      }),
    )
  }
}

export let cloudStorage: CloudStorage | null
