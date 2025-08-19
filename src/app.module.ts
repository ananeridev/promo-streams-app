import { Module } from '@nestjs/common'
import { PromotionModule } from './promotion/promotion.module'
import { PrismaService } from './prisma/prisma.service'
import { SwrCacheService } from './cache/swr-cache.service'

@Module({
	imports: [PromotionModule],
	providers: [PrismaService, SwrCacheService]
})
export class AppModule {}
