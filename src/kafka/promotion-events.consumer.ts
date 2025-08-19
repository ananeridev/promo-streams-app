import { Controller, Logger } from '@nestjs/common'
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices'
import { PromotionService } from '../promotion/promotion.service'
import { IncomingPromotionEvent, normalizePromotion } from '../promotion/types'
import { SwrCacheService } from '../cache/swr-cache.service'

@Controller()
export class PromotionEventsConsumer {
	private readonly logger = new Logger(PromotionEventsConsumer.name)

	constructor(private readonly svc: PromotionService, private readonly cache: SwrCacheService) {}

	@MessagePattern(process.env.TOPIC_PROMOTION_EVENTS || 'promotion_events')
	async handle(@Payload() message: unknown, @Ctx() ctx: KafkaContext): Promise<void> {
		try {
			const valueBuf = ctx.getMessage().value as Buffer
			const data = JSON.parse(valueBuf.toString()) as IncomingPromotionEvent
			const normalized = normalizePromotion(data)
			await this.svc.upsertPromotion(normalized)
			await this.cache.bustFreshness('active_promotions')
		} catch (e) {
			this.logger.error(`Failed to handle message: ${e}`)
		}
	}
}
