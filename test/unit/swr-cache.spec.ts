import { SwrCacheService } from '../../src/cache/swr-cache.service'

describe('SwrCacheService', () => {
	it('retorna MISS e depois HIT', async () => {
		const cache = new SwrCacheService()
		const key = 'test:key'
		let calls = 0
		const loader = async () => {
			calls += 1
			return { now: Date.now() }
		}
		const a = await cache.getWithSWR(key, loader)
		expect(a.cache).toBe('MISS')
		const b = await cache.getWithSWR(key, loader)
		expect(b.cache).toBe('HIT')
		expect(calls).toBe(1)
	})
})
