import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { QuotationsService } from './quotations.service';

/**
 * Read-only public view of a shared quotation. The unguessable `shareToken`
 * grants access — no login — so a WhatsApp/email recipient can open the A4
 * document directly. Returns raw HTML (bypasses the JSON envelope via @Res).
 */
@Controller('public/quotations')
export class PublicQuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Public()
  @Get(':token')
  async view(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const html = await this.quotationsService.publicDocument(token);
    res.type('html').send(html);
  }
}
