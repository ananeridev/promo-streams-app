import { Module } from '@nestjs/common'
import { PromotionController } from './promotion.controller'
import { PromotionService } from './promotion.service'
import { PromotionEventsConsumer } from '../kafka/promotion-events.consumer'

@Module({
	controllers: [PromotionController],
	providers: [PromotionService, PromotionEventsConsumer]
})
export class PromotionModule {}
