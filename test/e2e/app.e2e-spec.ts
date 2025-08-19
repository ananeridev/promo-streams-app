import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'

function activeSeed() {
	return {
		promotion: {
			id: '11111111-1111-1111-1111-111111111111',
			title: 'Active',
			description: null,
			status: 'ACTIVE',
			startsAt: new Date(Date.now() - 60_000),
			endsAt: new Date(Date.now() + 86_400_000),
			tenantId: null
		}
	}
}

describe('E2E /promotions/active', () => {
	let app: INestApplication
	let prisma: PrismaService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
		app = moduleRef.createNestApplication()
		prisma = moduleRef.get(PrismaService)
		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('retorna itens ativos e cabeçalho de cache', async () => {
		const seed = activeSeed()
		await prisma.promotion.create({ data: seed.promotion as any })
		await prisma.materializedActivePromotion.create({
			data: {
				promotionId: seed.promotion.id,
				title: seed.promotion.title,
				startsAt: seed.promotion.startsAt,
				endsAt: seed.promotion.endsAt,
				tenantId: null
			}
		})

		const res = await request(app.getHttpServer()).get('/promotions/active')
		expect(res.status).toBe(200)
		expect(res.headers['x-cache']).toBeDefined()
		expect(res.body.items.length).toBeGreaterThan(0)
	})
})
