import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { Auth, drive_v3, google } from 'googleapis';
import winston from 'winston';
import * as keys from '../googleapi.json';
import { configuration } from './configuration';

/** The cloud storage system */
export class CloudStorage {
  /** Authentication client */
  private client: Auth.JWT;
  /** Google drive client */
  private drive: drive_v3.Drive | undefined;

  /**
   *  Constructor
   *  @param logger the logger instance
   */
  constructor(private logger: winston.Logger) {
    this.client = new google.auth.JWT(keys.client_email, undefined, keys.private_key, [
      'https://www.googleapis.com/auth/drive'
    ]);
  }

  /**
   * Initialize the singleton
   * @param logger the logger instance
   */
  static launch(logger: winston.Logger) {
    cloudStorage = new CloudStorage(logger);
  }

  /**
   * Execute an authorization, if needed, and generate an instance of a client
   */
  private async authorize(): Promise<void> {
    if (this.drive) return;
    await this.client.authorize();
    this.drive = google.drive({ version: 'v3', auth: this.client });
  }

  /**
   * Extract the list of files in a Drive folder
   * @returns the array of string containing the name of the files
   */
  async list(): Promise<string[]> {
    await this.authorize();
    const response = await this.drive!.files.list({
      pageSize: 100,
      fields: 'nextPageToken, files(name)',
      orderBy: 'createdTime desc',
      q: `trashed = false and '${configuration?.googleDrive.folderId!}' in parents`
    });
    const files = response.data.files;
    if (files?.length) {
      let result = files
        .map((file) => file.name!)
        .filter((n) => n.startsWith(configuration?.googleDrive.fileNamePrefix!));
      this.logger.debug(`Files: ${result.join(' ')}`);
      return result;
    } else {
      this.logger.debug('No files found.');
    }
    return [];
  }

  /**
   * Execute the upload of a list of file
   * @param toBeDownloadedIndexes the array of indexes and dates
   */
  async uploadAll(toBeDownloadedIndexes: { index: number; date: Date }[]) {
    await this.authorize();
    await Promise.all(
      toBeDownloadedIndexes.map(async (entry) => {
        const localFile = `output${entry.index}.pdf`;
        const remoteFile = `${configuration?.googleDrive.fileNamePrefix!}_${String(
          entry.date.getFullYear() - 2000
        ).padStart(2, '0')}_${String(entry.date.getMonth() + 1).padStart(2, '0')}${
          entry.date.getDate() >= 15 ? '_AGG' : ''
        }.pdf`;
        await this.upload(localFile, remoteFile);
      })
    );
  }

  /**
   * Execute the upload of a file
   * @param localFile the path of the local file
   * @param remoteFile the name of the remote file
   */
  private async upload(localFile: string, remoteFile: string): Promise<void> {
    this.logger.debug(`Uploading file ${localFile} to ${remoteFile}`);
    await this.drive!.files.create({
      media: {
        body: createReadStream(localFile)
      },
      fields: 'id',
      requestBody: {
        name: remoteFile,
        parents: [configuration?.googleDrive.folderId!]
      }
    });
    
    // Delete the local file
    await unlink(localFile);
  }
}

/** The singleton instance to be initialized by the @see launch() method */
export let cloudStorage: CloudStorage | null;
