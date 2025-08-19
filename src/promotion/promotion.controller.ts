import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { SwrCacheService } from '../cache/swr-cache.service'
import { PromotionService } from './promotion.service'

@Controller('promotions')
export class PromotionController {
	constructor(private readonly svc: PromotionService, private readonly cache: SwrCacheService) {}

	@Get('active')
	async active(@Res() res: Response) {
		const key = 'active_promotions'
		const { data, cache } = await this.cache.getWithSWR(key, async () => this.svc.listActive())
		res.setHeader('x-cache', cache)
		return res.json({ items: data })
	}
}
