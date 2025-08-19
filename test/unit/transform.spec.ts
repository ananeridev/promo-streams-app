import { normalizePromotion, isActive } from '../../src/promotion/types'

describe('normalizePromotion', () => {
	it('normaliza strings e datas', () => {
		const e = {
			eventId: 'e1',
			type: 'CREATED',
			payload: {
				id: 'c8a3b6a4-2f5e-4a0b-9f4e-1a2b3c4d5e6f',
				title: '  Promo X  ',
				description: '  desc  ',
				status: 'ACTIVE',
				startsAt: '2025-08-01T00:00:00.000Z',
				endsAt: '2025-09-01T00:00:00.000Z'
			}
		}
		const p = normalizePromotion(e as any)
		expect(p.title).toBe('Promo X')
		expect(p.description).toBe('desc')
	})

	it('isActive considera janela e status', () => {
		const now = new Date('2025-08-10T12:00:00Z')
		const p = {
			id: '1',
			title: 'A',
			status: 'ACTIVE',
			startsAt: new Date('2025-08-01T00:00:00Z'),
			endsAt: new Date('2025-09-01T00:00:00Z'),
			updatedAt: new Date()
		} as any
		expect(isActive(now, p)).toBe(true)
	})
})
