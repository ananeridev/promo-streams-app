import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NormalizedPromotion, isActive } from './types'

@Injectable()
export class PromotionService {
	constructor(private readonly prisma: PrismaService) {}

	async upsertPromotion(p: NormalizedPromotion): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await tx.promotionEvent.create({
				data: {
					eventId: `${p.id}-${p.updatedAt.getTime()}`,
					promotionId: p.id,
					type: 'UPSERT',
					payload: p as unknown as object
				}
			})

			await tx.promotion.upsert({
				where: { id: p.id },
				create: {
					id: p.id,
					title: p.title,
					description: p.description,
					status: p.status,
					startsAt: p.startsAt,
					endsAt: p.endsAt ?? undefined,
					updatedAt: p.updatedAt,
					tenantId: p.tenantId ?? undefined
				},
				update: {
					title: p.title,
					description: p.description,
					status: p.status,
					startsAt: p.startsAt,
					endsAt: p.endsAt ?? undefined,
					updatedAt: p.updatedAt,
					version: { increment: 1 },
					tenantId: p.tenantId ?? undefined
				}
			})

			const active = isActive(new Date(), p)
			active
				? await tx.materializedActivePromotion.upsert({
						where: { promotionId: p.id },
						create: {
							promotionId: p.id,
							title: p.title,
							startsAt: p.startsAt,
							endsAt: p.endsAt ?? undefined,
							tenantId: p.tenantId ?? undefined
						},
						update: {
							title: p.title,
							startsAt: p.startsAt,
							endsAt: p.endsAt ?? undefined,
							tenantId: p.tenantId ?? undefined
						}
				  })
				: await tx.materializedActivePromotion.deleteMany({ where: { promotionId: p.id } })
		})
	}

	async listActive(): Promise<Array<{ id: string; title: string; startsAt: Date; endsAt: Date | null }>> {
		const rows = await this.prisma.materializedActivePromotion.findMany({ orderBy: { startsAt: 'desc' } })
		return rows.map((r) => ({ id: r.promotionId, title: r.title, startsAt: r.startsAt, endsAt: r.endsAt ?? null }))
	}
}
