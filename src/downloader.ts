import { writeFileSync } from 'fs'
import path from 'path'
import puppeteer, { Browser, Frame, Page } from 'puppeteer'
import winston from 'winston'
import { configuration } from './configuration'

export class Downloader {
  browser: Browser | undefined
  page: Page | undefined

  constructor(private logger: winston.Logger) {}

  static launch(logger: winston.Logger) {
    downloader = new Downloader(logger)
  }

  async list(): Promise<string[]> {
    this.logger.info('Starting downloader process')
    this.browser = await puppeteer.launch({
      slowMo: 100,
      defaultViewport: null,
    })
    this.page = await this.browser.newPage()
    this.page.exposeFunction(
      'saveFile',
      (buffer: Uint8Array, filePath: string) => {
        this.logger.debug(`Response received, writing buffer to ${filePath}`)
        writeFileSync(filePath, Buffer.from(buffer))
      },
    )

    this.logger.info('Navigating to login page')
    await this.login(this.page)

    this.logger.info('Navigating to MySpace')
    const frame = await this.page.waitForSelector('iframe[name=Main]')
    const frameContent = (await frame!.contentFrame())!
    await this.goToMySpace(frameContent)

    this.logger.info('Analyzing table content')
    let data = await this.extractDocumentTable(frameContent)
    this.logger.debug(`Documents dates: ${data.join(' ')}`)
    return data
  }

  private async login(page: Page) {
    await page.goto('https://saas.hrzucchetti.it/mipstdscarrone/jsp/login.jsp')
    await page.waitForNavigation()
    await page.type('input[name=m_cUserName]', configuration?.portal.username!)
    await page.type('input[name=m_cPassword]', configuration?.portal.password!)
    await page.click('input.Accedi_ctrl')
  }
  private async goToMySpace(frameContent: Frame) {
    await new Promise((r) => setTimeout(r, 500))
    await frameContent.waitForSelector('text/MySpace')
    await new Promise((r) => setTimeout(r, 1500))
    await frameContent.click('div.tabNavigation div.tab_item:not(.actived) a')
  }
  private async extractDocumentTable(frameContent: Frame): Promise<string[]> {
    return await (await frameContent.waitForSelector(
      "xpath///td[contains(@class,'icon_font_grid')]/../..",
    ))!.evaluate((e) =>
      Array.from(e.querySelectorAll('tr')).map((tr) =>
        tr.children[2].textContent?.match(/.*Libro unico.*/)
          ? tr.children[3].textContent!
          : '',
      ),
    )
  }

  async downloadAll(indexList: number[]) {
    this.logger.info('Downloading missing indexes')
    for (const index of indexList) {
      await this.download(index)
    }
  }
  async download(index: number) {
    this.logger.info(`Downloading index ${index}`)

    this.logger.debug(`Preparing the download`)
    const frame = await this.page!.waitForSelector('iframe[name=Main]')
    const frameContent = (await frame!.contentFrame())!
    await frameContent.evaluate(() => {
      const w = <any>window
      w.link = ''
      w.windowOpenForeground.apply = (arg0: any, arg1: any) => {
        ;(<any>window).link = <string>arg1[0]
      }
    })
    await frameContent.click(
      `xpath/(//td[contains(@class,'icon_font_grid')]//a)[${index + 1}]`,
    )
    this.logger.debug(`Link clicked`)
    const pdfLink = await frameContent.evaluate(
      () => <string>(<any>window).link,
    )
    this.logger.debug(`Fetching link ${pdfLink}`)
    const filePath = `output${index}.pdf`
    let buffer = await frameContent.evaluate(
      async (params) => {
        const fetched = await fetch(params.pdfLink)
        const buffer = await fetched.arrayBuffer()
        const arrayOfBytes = Array.from(new Uint8Array(buffer))
        return arrayOfBytes
      },
      { pdfLink: pdfLink, filePath: path.join(process.cwd(), filePath) },
    )
    this.logger.debug(`Response received, writing buffer to ${filePath}`)
    writeFileSync(filePath, new Uint8Array(buffer))
  }
}

export let downloader: Downloader | null
