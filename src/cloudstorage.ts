import { Auth, drive_v3, google } from 'googleapis'
import winston from 'winston'
import * as keys from '../googleapi.json'

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
      pageSize: 10,
      fields: 'nextPageToken, files(name)',
      orderBy: 'createdTime desc',
      q: "name != 'Buste paga'",
    })
    const files = response.data.files
    if (files?.length) {
      let result = files.map((file) => file.name!)
      this.logger.debug(
        `Files: ${files.map((file) => `${file.name}`).join(' ')}`,
      )
      return result
    } else {
      this.logger.debug('No files found.')
    }
    return []
  }
}

export let cloudStorage: CloudStorage | null
