import puppeteer, { Frame, Page } from 'puppeteer'
import winston from 'winston'
import { configuration } from './configuration'

export class Downloader {
  constructor(private logger: winston.Logger) {}

  static launch(logger: winston.Logger) {
    downloader = new Downloader(logger)
    logger.info(`Log level set as ${configuration?.logger.level}`)
  }
  async download() {
    this.logger.info('Starting downloader process')
    const browser = await puppeteer.launch({
      slowMo: 10,
      defaultViewport: { width: 1366, height: 768 },
    })
    const page = await browser.newPage()

    this.logger.info('Navigating to login page')
    await this.login(page)

    this.logger.info('Navigating to MySpace')
    const frame = await page.waitForSelector('iframe[name=Main]')
    const frameContent = (await frame!.contentFrame())!
    await this.goToMySpace(frameContent)

    this.logger.info('Analyzing table content')
    let data = await this.extractDocumentTable(frameContent)
    this.logger.debug(`Documents dates: ${data.join(' ')}`)
  }

  async login(page: Page) {
    await page.goto('https://saas.hrzucchetti.it/mipstdscarrone/jsp/login.jsp')
    await page.waitForNavigation()
    await page.type('input[name=m_cUserName]', configuration?.portal.username!)
    await page.type('input[name=m_cPassword]', configuration?.portal.password!)
    await page.click('input.Accedi_ctrl')
  }
  async goToMySpace(frameContent: Frame) {
    await frameContent.waitForSelector('text/MySpace')
    await new Promise((r) => setTimeout(r, 500))
    await frameContent.click('div.tabNavigation div.tab_item:not(.actived) a')
    await new Promise((r) => setTimeout(r, 500))
    await frameContent.click('div.tabNavigation div.tab_item:not(.actived) a')
  }
  async extractDocumentTable(frameContent: Frame) {
    return await (await frameContent.waitForSelector(
      "xpath///td[contains(@class,'icon_font_grid')]/../..",
    ))!.evaluate((e) =>
      Array.from(e.querySelectorAll('tr')).map(
        (tr) => tr.children[3].textContent,
      ),
    )
  }
}

export let downloader: Downloader | null
