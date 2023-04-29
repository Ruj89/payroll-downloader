import { writeFileSync } from 'fs';
import path from 'path';
import puppeteer, { Browser, Frame, Page } from 'puppeteer';
import winston from 'winston';
import { configuration } from './configuration';

/** The class that downloads and scrapes the website */
export class Downloader {
  browser: Browser | undefined;
  page: Page | undefined;

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
    downloader = new Downloader(logger);
  }

  /**
   * Extract the list of downloadable documents from the web site
   * @returns the list of dates or invalid elements
   */
  async list(): Promise<(string | null)[]> {
    // Setup and launch the browser with a clean page
    this.logger.info('Starting downloader process');
    this.browser = await puppeteer.launch({
      slowMo: 100,
      defaultViewport: null
    });
    this.page = await this.browser.newPage();

    // Execute the login
    this.logger.info('Navigating to login page');
    await this.login(this.page);

    // Enter the documents page
    this.logger.info('Navigating to MySpace');
    const frame = await this.page.waitForSelector('iframe[name=Main]');
    const frameContent = (await frame!.contentFrame())!;
    await this.goToMySpace(frameContent);

    // Scrape the documents table
    this.logger.info('Analyzing table content');
    let data = await this.extractDocumentTable(frameContent);
    this.logger.debug(`Documents dates: ${data.join(' ')}`);
    return data;
  }

  /**
   * Execute the login
   * @param page the page to be used to log in
   */
  private async login(page: Page): Promise<void> {
    // Fill the form
    await page.goto('https://saas.hrzucchetti.it/mipstdscarrone/jsp/login.jsp');
    try {
      await page.waitForNavigation();
    } catch (e) {}
    await page.type('input[name=m_cUserName]', configuration?.portal.username!);
    await page.type('input[name=m_cPassword]', configuration?.portal.password!);
    // Click on submit
    await page.click('input.Accedi_ctrl');
  }

  /**
   * Navigate through the document page
   * @param frameContent the frame containing the navigation menu
   */
  private async goToMySpace(frameContent: Frame): Promise<void> {
    // Wait the frame is loaded
    await new Promise((r) => setTimeout(r, 500));
    await frameContent.waitForSelector('text/MySpace');
    // Click on the navigation bar button
    await new Promise((r) => setTimeout(r, 1500));
    await frameContent.click('div.tabNavigation div.tab_item:not(.actived) a');
  }

  /**
   * Parse the documents table
   * @param frameContent the frame containing the documents table
   * @returns a list of dates or null if not valid entry
   */
  private async extractDocumentTable(frameContent: Frame): Promise<(string | null)[]> {
    return await (await frameContent.waitForSelector(
      "xpath///td[contains(@class,'icon_font_grid')]/../.."
    ))!.evaluate((e) =>
      Array.from(e.querySelectorAll('tr')).map((tr) =>
        tr.children[2].textContent?.match(/.*Libro unico.*/) ? tr.children[3].textContent : null
      )
    );
  }

  /**
   * Download the documents file
   * @param indexList the list of indexes of the row to be downloaded
   */
  async downloadAll(indexList: number[]): Promise<void> {
    this.logger.info('Downloading missing indexes');
    for (const index of indexList) {
      await this.download(index);
    }
  }

  /**
   * Download a document file
   * @param index the index of the row to be downloaded
   */
  async download(index: number): Promise<void> {
    this.logger.info(`Downloading index ${index}`);

    this.logger.debug(`Preparing the download`);
    const frame = await this.page!.waitForSelector('iframe[name=Main]');
    const frameContent = (await frame!.contentFrame())!;
    // Replace the function to open a new window to a function that saves the link to be opened
    await frameContent.evaluate(() => {
      const w = <any>window;
      w.link = '';
      w.windowOpenForeground.apply = (arg0: any, arg1: any) => {
        (<any>window).link = <string>arg1[0];
      };
    });

    // Click the link
    await frameContent.click(`xpath/(//td[contains(@class,'icon_font_grid')]//a)[${index + 1}]`);
    this.logger.debug(`Link clicked`);

    // Get the link saved and fetch it using the browser
    const pdfLink = await frameContent.evaluate(() => <string>(<any>window).link);
    this.logger.debug(`Fetching link ${pdfLink}`);
    const filePath = `output${index}.pdf`;
    let buffer = await frameContent.evaluate(
      async (params) => {
        const fetched = await fetch(params.pdfLink);
        const buffer = await fetched.arrayBuffer();
        const arrayOfBytes = Array.from(new Uint8Array(buffer));
        return arrayOfBytes;
      },
      { pdfLink: pdfLink, filePath: path.join(process.cwd(), filePath) }
    );

    // Save the buffer on disk
    this.logger.debug(`Response received, writing buffer to ${filePath}`);
    writeFileSync(filePath, new Uint8Array(buffer));
  }
}

/** The singleton instance to be initialized by the @see launch() method */
export let downloader: Downloader | null;
