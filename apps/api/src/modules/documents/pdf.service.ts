import { Injectable, Logger } from '@nestjs/common';

export interface PdfOptions {
  /** Render a running "Page X of Y" footer (multi-page bills). */
  showPageNumbers?: boolean;
  /** Optional left-aligned label in the footer (e.g. document number). */
  footerLabel?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Turns an A4 HTML document into PDF bytes using headless Chromium (Puppeteer).
 *
 * Puppeteer is an OPTIONAL dependency: it is imported lazily so the API boots
 * and all tests pass without Chromium installed. When it isn't available the
 * service returns null and callers fall back to serving the print-ready A4 HTML
 * (the browser's "Save as PDF" produces the same A4 output). To enable true
 * server-side PDF bytes (needed for email attachments), install it once:
 *
 *   pnpm add puppeteer --filter @hardware-pos/api
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private unavailable = false;

  get available(): boolean {
    return !this.unavailable;
  }

  async htmlToPdf(html: string, options: PdfOptions = {}): Promise<Buffer | null> {
    const puppeteer = await this.loadPuppeteer();
    if (!puppeteer) return null;

    let browser: any;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        // Use an existing Chrome/Chromium when provided (avoids the ~150MB
        // bundled-Chromium download); otherwise Puppeteer's own binary is used.
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      // A running "Page X of Y" footer for multi-page bills. Puppeteer renders
      // its own header/footer templates in the reserved page margin, so the
      // bottom margin is widened to make room when the footer is enabled.
      const footer = options.showPageNumbers;
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: footer,
        headerTemplate: '<span></span>',
        footerTemplate: footer
          ? `<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:#94a3b8;padding:0 12mm;display:flex;justify-content:space-between;">
               <span>${escapeHtml(options.footerLabel ?? '')}</span>
               <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
             </div>`
          : '<span></span>',
        margin: {
          top: '12mm',
          bottom: footer ? '18mm' : '12mm',
          left: '12mm',
          right: '12mm',
        },
      });
      return Buffer.from(pdf);
    } catch (err) {
      this.logger.warn(`PDF generation failed, falling back to HTML: ${(err as Error).message}`);
      return null;
    } finally {
      if (browser) await browser.close().catch(() => undefined);
    }
  }

  private async loadPuppeteer(): Promise<any | null> {
    if (this.unavailable) return null;
    try {
      // Indirect import so TypeScript/bundlers don't require the module to exist.
      const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
      const mod = await dynamicImport('puppeteer');
      return mod.default ?? mod;
    } catch {
      this.unavailable = true;
      this.logger.log(
        'puppeteer not installed — serving print-ready A4 HTML instead of PDF bytes. ' +
          'Run `pnpm add puppeteer --filter @hardware-pos/api` to enable server-side PDF.',
      );
      return null;
    }
  }
}
